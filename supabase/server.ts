import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Server-only admin: uses SERVICE ROLE key, bypasses RLS */
export default function createClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export { createClient as createServerClient }; 
export const supabaseAdmin: SupabaseClient<Database> = createSupabaseClient<Database>(
    SUPABASE_URL,  
    SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);