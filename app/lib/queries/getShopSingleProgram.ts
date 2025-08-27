// app/lib/queries/getProgramForEdit.ts
import createClient from "../../utils/supabase/admin";
import type {Tables} from "../types/dbTables";

type Program = Tables<"programs">;
const supabase = createClient();

export async function getProgramForEdit(shopId: number, programId: number): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("shop", shopId)
    .eq("id", programId)
    .single();

  if (error || !data) throw new Error("program_not_found");
  return data as Program;
}
