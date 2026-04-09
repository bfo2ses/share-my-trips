import { createClient, cacheExchange, fetchExchange, mapExchange } from 'urql';

const API_URL = import.meta.env.VITE_API_URL || '/graphql';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
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
    cacheExchange,
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
