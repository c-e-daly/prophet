// app/lib/queries/getEnums.server.ts
import { createClient } from "@supabase/supabase-js";

export type EnumMap = Record<string, string[]>;

/**
 * Fetch all enums from Postgres via Supabase.
 * Returns a flat map { enum_name: [values...] }
 */
export async function getEnumsServer(): Promise<EnumMap> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc("get_all_enums");
  if (error) throw error;

  // If get_enums returns rows
  if (Array.isArray(data)) {
    return Object.fromEntries(
      data.map((row: { enum_name: string; enum_values: string[] }) => [
        row.enum_name,
        row.enum_values,
      ])
    );
  }

  // If get_enums returns a JSON object
  return (data as EnumMap) ?? {};
}
