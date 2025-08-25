// app/lib/queries/getProgramForEdit.ts
import createClient from "../../utils/supabase/admin";
import type { Program } from "./enumTypes";

const supabase = createClient();

export async function getProgramForEdit(shopId: number, programId: number): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .select("id,shop,campaign,name,type,status,start_date,end_date")
    .eq("shop", shopId)
    .eq("id", programId)
    .single();

  if (error || !data) throw new Error("program_not_found");
  return data as Program;
}
