import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error('Missing Supabase env vars. Copy .env.example to .env and fill in your project credentials.')
}

// Guarded: createClient() throws synchronously on a missing URL, which would
// crash the whole app at import time (blank white screen, no React error
// boundary can catch it). Fall back to null and let AuthContext show a
// friendly configuration screen instead.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
