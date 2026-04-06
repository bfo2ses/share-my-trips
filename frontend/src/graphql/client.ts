import { createClient, cacheExchange, fetchExchange } from 'urql';

const API_URL = import.meta.env.VITE_API_URL || '/graphql';

export const client = createClient({
  url: API_URL,
  exchanges: [cacheExchange, fetchExchange],
});
