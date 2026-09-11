// src/lib/supabase.js
import { createBrowserClient } from '@supabase/ssr';

let client = null;

export const getSupabase = () => {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Supabase keys missing:', { url: !!url, key: !!key });
  }

  client = createBrowserClient(url || '', key || '');
  return client;
};

// Export proxy instance for backward compatibility with your existing imports
export const supabase = new Proxy(
  {},
  {
    get: (target, prop) => {
      const instance = getSupabase();
      return typeof instance[prop] === 'function'
        ? instance[prop].bind(instance)
        : instance[prop];
    },
  }
);
