import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for use in background jobs (Inngest functions).
 * Bypasses Row Level Security — only use server-side.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
