// utils/supabase/server.ts
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-only admin: uses SERVICE ROLE key, bypasses RLS */
export function createClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default createClient;
