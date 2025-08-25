//app/utils/supabase/admin.ts - Service Role Key 
import type { Database } from '../../../supabase/database.types'; 
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

export function createClient<Database>(): SupabaseClient {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default createClient;

