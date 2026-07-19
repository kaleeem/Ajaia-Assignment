import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 * Credentials are read exclusively from NEXT_PUBLIC_* env vars (never hardcoded).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local.",
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
