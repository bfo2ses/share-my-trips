import { parse } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { makeClient } from './client';

const MeDocument = parse(`
  query TestMe {
    me {
      id
      name
    }
  }
`);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('makeClient', () => {
  it('attaches the captured token only to authenticated requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { me: null } }));
    vi.stubGlobal('fetch', fetchMock);

    await makeClient(null, vi.fn()).query(MeDocument, {}).toPromise();
    const anonymousHeaders = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(anonymousHeaders.has('Authorization')).toBe(false);

    await makeClient('token-a', vi.fn()).query(MeDocument, {}).toPromise();
    const authenticatedHeaders = new Headers(fetchMock.mock.calls[1][1]?.headers);
    expect(authenticatedHeaders.get('Authorization')).toBe('Bearer token-a');
  });

  it('keeps each client bound to the token it captured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { me: null } }));
    vi.stubGlobal('fetch', fetchMock);
    const clientA = makeClient('token-a', vi.fn());
    const clientB = makeClient('token-b', vi.fn());

    await clientA.query(MeDocument, {}, { requestPolicy: 'network-only' }).toPromise();
    await clientB.query(MeDocument, {}, { requestPolicy: 'network-only' }).toPromise();

    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer token-a');
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer token-b');
  });

  it('uses an isolated graphcache for each auth state', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { me: null } }))
      .mockResolvedValueOnce(jsonResponse({ data: { me: { __typename: 'Account', id: '1', name: 'Alice' } } }));
    vi.stubGlobal('fetch', fetchMock);

    const anonymousClient = makeClient(null, vi.fn());
    expect((await anonymousClient.query(MeDocument, {}).toPromise()).data?.me).toBeNull();
    expect((await anonymousClient.query(MeDocument, {}).toPromise()).data?.me).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const authenticatedClient = makeClient('token-a', vi.fn());
    expect((await authenticatedClient.query(MeDocument, {}).toPromise()).data?.me).toMatchObject({ id: '1', name: 'Alice' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('signals one unauthorized response exactly once', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ errors: [{ message: 'unauthorized' }] }, 401)));

    await makeClient('expired-token', onUnauthorized).query(MeDocument, {}).toPromise();

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not signal a non-401 transport failure as unauthorized', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await makeClient('token-a', onUnauthorized).query(MeDocument, {}).toPromise();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
