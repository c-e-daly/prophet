// app/lib/getEnums.ts
import { createClient } from "../../../supabase/server";

export type EnumMap = Record<string, string[]>;

export async function fetchAllEnums(
  types?: string[]
): Promise<EnumMap> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_all_enums", {
    enum_schema: "public",
    enum_types: types ?? null
  });
  if (error) {
    console.error("get_all_enums error:", error);
    return {};
  }
  return (data ?? {}) as EnumMap;
}
