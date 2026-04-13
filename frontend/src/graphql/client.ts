import { createClient, fetchExchange, mapExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/query';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function invalidateQuery(cache: Parameters<NonNullable<Parameters<typeof cacheExchange>[0]['updates']>['Mutation'][string]>[2], field: string) {
  const fields = cache.inspectFields('Query');
  for (const f of fields) {
    if (f.fieldName === field) {
      cache.invalidate('Query', field, f.arguments ?? undefined);
    }
  }
}

export const client = createClient({
  url: API_URL,
  exchanges: [
    mapExchange({
      onError(error) {
        if (error.response?.status === 401) {
          setAuthToken(null);
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
    if (!authToken) return {};
    return {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  },
});
