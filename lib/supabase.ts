import { createClient } from '@supabase/supabase-js';

// Helper to get environment variables safely
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof window !== 'undefined' && (window as any).process?.env) {
    return (window as any).process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseKey && supabaseUrl.length > 0 && supabaseKey.length > 0;
};

// We export a function to create the client to ensure we capture the keys 
// even if they are set later (e.g. by user input)
export const getSupabase = () => {
    const url = getEnv('VITE_SUPABASE_URL');
    const key = getEnv('VITE_SUPABASE_ANON_KEY');
    if (!url || !key) return null;
    return createClient(url, key);
};

export const supabase = getSupabase(); // Default instance if keys exist on load