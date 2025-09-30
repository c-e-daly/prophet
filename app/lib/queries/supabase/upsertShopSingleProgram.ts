// app/lib/queries/supabase/upsertShopSingleProgram.ts
import  createClient from "../../../../supabase/server";
import type { Inserts, Tables } from "../../types/dbTables";

type ProgramUpdate = Partial<Inserts<"programs">>;

export async function upsertShopSingleProgram(
  shopsID: number,
   payload: ProgramUpdate
) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const updateData = {
    ...payload,
    modifiedDate: nowIso,
  };

  const programsID = updateData.programsID;

  const { data, error } = await supabase
    .from("programs")
    .update(updateData)
    .eq("shop", shopsID)
    .eq("id", programsID)
    .select("*")
    .single();

  if (error) {
    const fmt = `${error.message ?? "unknown"} | code=${error.code ?? ""} details=${error.details ?? ""} hint=${error.hint ?? ""}`;
    throw new Error(`Failed to update program: ${fmt}`);
  }

  return data;
}
