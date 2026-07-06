import { createClient, fetchExchange, mapExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import type { Cache } from '@urql/exchange-graphcache';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/query';

function invalidateQuery(cache: Cache, field: string) {
  const fields = cache.inspectFields('Query');
  for (const f of fields) {
    if (f.fieldName === field) {
      cache.invalidate('Query', field, f.arguments ?? undefined);
    }
  }
}

// One client per auth state, holding its own token: recreated whenever the
// token changes so the cache never leaks data across auth states (e.g. a
// `me: null` cached before login being served after login).
export function makeClient(token: string | null, onUnauthorized: () => void) {
  return createClient({
    url: API_URL,
    exchanges: [
      mapExchange({
        onError(error) {
          // Defensive only: the GraphQL endpoint currently never answers 401
          // (invalid sessions come back as `me: null`, handled in
          // ProtectedLayout). This covers future 401-emitting endpoints.
          if (error.response?.status === 401) {
            onUnauthorized();
          }
        },
      }),
      cacheExchange({
        updates: {
          Mutation: {
            createTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            updateTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            deleteTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            publishTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            unpublishTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            closeTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            reopenTrip: (_result, _args, cache) => invalidateQuery(cache, 'trips'),
            addStage: (_result, _args, cache) => {
              invalidateQuery(cache, 'stages');
              invalidateQuery(cache, 'trip');
            },
            updateStage: (_result, _args, cache) => invalidateQuery(cache, 'stages'),
            deleteStage: (_result, _args, cache) => {
              invalidateQuery(cache, 'stages');
              invalidateQuery(cache, 'tripDays');
            },
            addDay: (_result, _args, cache) => invalidateQuery(cache, 'tripDays'),
            updateDay: (_result, _args, cache) => invalidateQuery(cache, 'tripDays'),
            deleteDay: (_result, _args, cache) => invalidateQuery(cache, 'tripDays'),
          },
        },
      }),
      fetchExchange,
    ],
    fetchOptions: () => {
      if (!token) return {};
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    },
  });
}
