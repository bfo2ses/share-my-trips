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

const TripDetailDocument = parse(`
  query TestTripDetail($id: ID!) {
    trip(id: $id) {
      __typename
      id
      title
    }
    stages(tripID: $id) {
      __typename
      id
      city
    }
    tripVisits(tripID: $id) {
      __typename
      id
      title
    }
    travelLegs(tripID: $id) {
      __typename
      id
      transport
    }
  }
`);

const CreateTravelLegDocument = parse(`
  mutation TestCreateTravelLeg($input: CreateTravelLegInput!) {
    createTravelLeg(input: $input) {
      __typename
      travelLeg {
        __typename
        id
        transport
      }
      errors {
        __typename
        message
      }
    }
  }
`);

const DeleteTravelLegDocument = parse(`
  mutation TestDeleteTravelLeg($id: ID!) {
    deleteTravelLeg(id: $id) {
      __typename
      success
      errors {
        __typename
        message
      }
    }
  }
`);

const UpdateTravelLegDocument = parse(`
  mutation TestUpdateTravelLeg($id: ID!, $input: UpdateTravelLegInput!) {
    updateTravelLeg(id: $id, input: $input) {
      __typename
      travelLeg {
        __typename
        id
        tripID
        transport
      }
      errors {
        __typename
        message
      }
    }
  }
`);

const VisitMediaDocument = parse(`
  query TestVisitMedia($visitID: ID!) {
    visitMedia(visitID: $visitID) {
      __typename
      id
      visitID
      travelLegID
      tripID
      filename
    }
  }
`);

const TravelLegMediaDocument = parse(`
  query TestTravelLegMedia($travelLegID: ID!) {
    travelLegMedia(travelLegID: $travelLegID) {
      __typename
      id
      visitID
      travelLegID
      tripID
      filename
    }
  }
`);

const MoveMediaDocument = parse(`
  mutation TestMoveMedia($input: MoveMediaInput!) {
    moveMedia(input: $input) {
      __typename
      media {
        __typename
        id
        visitID
        travelLegID
        tripID
        position
      }
      errors {
        __typename
        message
      }
    }
  }
`);

const DeleteMediaDocument = parse(`
  mutation TestDeleteMedia($id: ID!) {
    deleteMedia(id: $id) {
      __typename
      success
      errors {
        __typename
        message
      }
    }
  }
`);

const SetupStatusDocument = parse(`
  query TestSetupStatus {
    setupStatus {
      done
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

  it('keeps setup status embedded without a graphcache warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      data: { setupStatus: { __typename: 'SetupStatusPayload', done: false } },
    })));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await makeClient(null, vi.fn()).query(SetupStatusDocument, {}).toPromise();

    expect(result.data?.setupStatus).toEqual({ done: false });
    expect(warnSpy).not.toHaveBeenCalled();
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

  it('invalidates the travel leg list after creating one', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: {
        trip: { __typename: 'Trip', id: 'trip-1', title: 'Road trip' }, stages: [], tripVisits: [],
        travelLegs: [{ __typename: 'TravelLeg', id: 'leg-1', transport: 'CAR' }],
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: { createTravelLeg: { __typename: 'CreateTravelLegPayload', travelLeg: { __typename: 'TravelLeg', id: 'leg-2', tripID: 'trip-1', transport: 'TRAIN' }, errors: [] } } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeClient('token-a', vi.fn());

    await client.query(TripDetailDocument, { id: 'trip-1' }).toPromise();
    await client.mutation(CreateTravelLegDocument, {
      input: { tripID: 'trip-1', fromStageID: 'stage-1', toStageID: 'stage-2', transport: 'TRAIN' },
    }).toPromise();
    const result = await client.query(TripDetailDocument, { id: 'trip-1' }).toPromise();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data?.travelLegs).toHaveLength(2);
  });

  it('invalidates the travel leg list after deleting one', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: {
        trip: { __typename: 'Trip', id: 'trip-1', title: 'Road trip' }, stages: [], tripVisits: [],
        travelLegs: [{ __typename: 'TravelLeg', id: 'leg-1', transport: 'CAR' }],
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: { deleteTravelLeg: { __typename: 'DeleteTravelLegPayload', success: true, errors: [] } } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeClient('token-a', vi.fn());

    await client.query(TripDetailDocument, { id: 'trip-1' }).toPromise();
    await client.mutation(DeleteTravelLegDocument, { id: 'leg-1' }).toPromise();
    const result = await client.query(TripDetailDocument, { id: 'trip-1' }).toPromise();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data?.travelLegs).toHaveLength(0);
  });

  it('invalidates the travel leg list after updating one', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: {
        trip: { __typename: 'Trip', id: 'trip-1', title: 'Road trip' }, stages: [], tripVisits: [],
        travelLegs: [{ __typename: 'TravelLeg', id: 'leg-1', tripID: 'trip-1', transport: 'CAR' }],
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: { updateTravelLeg: {
        __typename: 'TravelLegPayload',
        travelLeg: { __typename: 'TravelLeg', id: 'leg-1', tripID: 'trip-1', transport: 'TRAIN' },
        errors: [],
      } } }))
      .mockResolvedValueOnce(jsonResponse({ data: {
        trip: { __typename: 'Trip', id: 'trip-1', title: 'Road trip' }, stages: [], tripVisits: [],
        travelLegs: [{ __typename: 'TravelLeg', id: 'leg-1', tripID: 'trip-1', transport: 'TRAIN' }],
      } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeClient('token-a', vi.fn());

    await client.query(TripDetailDocument, { id: 'trip-1' }).toPromise();
    await client.mutation(UpdateTravelLegDocument, {
      id: 'leg-1',
      input: { transport: 'TRAIN' },
    }).toPromise();
    const result = await client.query(TripDetailDocument, { id: 'trip-1' }).toPromise();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.data?.travelLegs[0].transport).toBe('TRAIN');
  });

  it('invalidates source and destination media galleries after moving media', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: {
        visitMedia: [{ __typename: 'Media', id: 'media-1', visitID: 'visit-1', travelLegID: null, tripID: 'trip-1', filename: 'photo.jpg' }],
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: { travelLegMedia: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: {
        moveMedia: {
          __typename: 'MoveMediaPayload',
          media: [{ __typename: 'Media', id: 'media-1', visitID: null, travelLegID: 'leg-1', tripID: 'trip-1', position: 0 }],
          errors: [],
        },
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: { visitMedia: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: {
        travelLegMedia: [{ __typename: 'Media', id: 'media-1', visitID: null, travelLegID: 'leg-1', tripID: 'trip-1', filename: 'photo.jpg' }],
      } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeClient('token-a', vi.fn());

    await client.query(VisitMediaDocument, { visitID: 'visit-1' }).toPromise();
    await client.query(TravelLegMediaDocument, { travelLegID: 'leg-1' }).toPromise();
    await client.mutation(MoveMediaDocument, {
      input: { mediaIDs: ['media-1'], visitID: null, travelLegID: 'leg-1' },
    }).toPromise();
    const source = await client.query(VisitMediaDocument, { visitID: 'visit-1' }).toPromise();
    const destination = await client.query(TravelLegMediaDocument, { travelLegID: 'leg-1' }).toPromise();

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(source.data?.visitMedia).toHaveLength(0);
    expect(destination.data?.travelLegMedia).toHaveLength(1);
  });

  it('invalidates media galleries after deleting media', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: {
        visitMedia: [{ __typename: 'Media', id: 'media-1', visitID: 'visit-1', travelLegID: null, tripID: 'trip-1', filename: 'photo.jpg' }],
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: {
        deleteMedia: { __typename: 'DeleteMediaPayload', success: true, errors: [] },
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: { visitMedia: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeClient('token-a', vi.fn());

    await client.query(VisitMediaDocument, { visitID: 'visit-1' }).toPromise();
    await client.mutation(DeleteMediaDocument, { id: 'media-1' }).toPromise();
    const result = await client.query(VisitMediaDocument, { visitID: 'visit-1' }).toPromise();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.data?.visitMedia).toHaveLength(0);
  });
});
