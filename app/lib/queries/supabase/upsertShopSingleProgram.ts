// app/lib/queries/supabase/upsertShopSingleProgram.ts
import  createClient  from "../../../../supabase/server";
import type { Inserts, Tables } from "../../types/dbTables";

type ProgramPayload = Partial<Inserts<"programs">>;

export async function upsertShopSingleProgram(
  shopId: number,
  programId: number | null, // null = create, number = update
  payload: ProgramPayload
): Promise<Tables<"programs">> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const isCreate = programId === null;

  if (isCreate) {
    // CREATE NEW PROGRAM
    const insertData: Inserts<"programs"> = {
      ...payload,
      created_at: nowIso,
      modifiedDate: nowIso,
    } as Inserts<"programs">;

    const { data, error } = await supabase
      .from("programs")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create program: ${error.message}`);
    }

    return data;
  } else {
    // UPDATE EXISTING PROGRAM
    const updateData = {
      ...payload,
      modifiedDate: nowIso,
    };

    const { data, error } = await supabase
      .from("programs")
      .update(updateData)
      .eq("shops", shopId)
      .eq("id", programId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update program: ${error.message}`);
    }

    return data;
  }
}