//app/utils/supabase/admin.ts - Service Role Key 

// utils/supabase/admin.ts
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default createClient;

