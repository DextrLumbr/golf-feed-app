// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Sanitize inputs by trimming whitespace and stripping quotes
const getEnv = (key) => {
  const val = process.env[key];
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase URL or Anon Key is missing from environment!');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
