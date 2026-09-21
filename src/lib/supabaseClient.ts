import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Frontend Supabase client — uses the publishable (anon-equivalent) key only.
 * This key is safe to ship in browser code because every table it can reach
 * is protected by Row Level Security (see supabase/schema.sql). The secret
 * key must never be imported here or anywhere else under src/.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env (see .env.example).',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)
