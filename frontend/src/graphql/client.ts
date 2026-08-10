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

type TravelLegMutationResult = {
  createTravelLeg?: {
    errors?: Array<unknown>;
    travelLeg?: { id: string; tripID: string } | null;
  };
  deleteTravelLeg?: {
    errors?: Array<unknown>;
    success?: boolean;
  };
};

function updateTravelLegLists(cache: Cache, update: (links: string[], tripID: string | undefined) => string[]) {
  for (const field of cache.inspectFields('Query')) {
    if (field.fieldName !== 'travelLegs') continue;
    const current = cache.resolve('Query', 'travelLegs', field.arguments ?? undefined);
    if (!Array.isArray(current)) continue;
    const links = current.filter((link): link is string => typeof link === 'string');
    cache.link('Query', 'travelLegs', field.arguments ?? {}, update(links, field.arguments?.tripID as string | undefined));
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
              invalidateQuery(cache, 'tripVisits');
            },
            addVisit: (_result, _args, cache) => invalidateQuery(cache, 'tripVisits'),
            updateVisit: (_result, _args, cache) => invalidateQuery(cache, 'tripVisits'),
            deleteVisit: (_result, _args, cache) => invalidateQuery(cache, 'tripVisits'),
            reorderVisits: (_result, _args, cache) => invalidateQuery(cache, 'tripVisits'),
            createTravelLeg: (result, _args, cache) => {
              const payload = (result as TravelLegMutationResult).createTravelLeg;
              const travelLeg = payload?.travelLeg;
              if (!travelLeg || (payload.errors?.length ?? 0) > 0) return;
              const key = cache.keyOfEntity({ __typename: 'TravelLeg', id: travelLeg.id });
              if (!key) return;
              updateTravelLegLists(cache, (links, tripID) => tripID === travelLeg.tripID && !links.includes(key) ? [...links, key] : links);
            },
            deleteTravelLeg: (result, args, cache) => {
              const payload = (result as TravelLegMutationResult).deleteTravelLeg;
              if (!payload?.success || (payload.errors?.length ?? 0) > 0) return;
              const key = cache.keyOfEntity({ __typename: 'TravelLeg', id: (args as { id: string }).id });
              if (!key) return;
              updateTravelLegLists(cache, (links) => links.filter((link) => link !== key));
            },
            reorderMedia: (_result, _args, cache) => {
              invalidateQuery(cache, 'visitMedia');
              invalidateQuery(cache, 'tripMedia');
            },
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
