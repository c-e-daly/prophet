//app/utils/supbase/client.tsx - Use Non key
import type { Database } from './database.types'; 
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/** Browser/client-side: uses ANON key, enforces RLS */
export function createClient<Database>(): SupabaseClient {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

export default createClient;
