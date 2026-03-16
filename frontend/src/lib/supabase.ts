import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY env variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Bypass Web Locks API to avoid 5s delay from React StrictMode orphaned locks
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
  },
  global: {
    // Abort requests that take longer than 15 seconds to prevent infinite loading
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    },
  },
});
