// app/lib/queries/deleteProgram.ts
import createClient from "../../../../supabase/admin";
const supabase = createClient();

export async function deleteShopProgram(shopId: number, programId: number) {
  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("shops", shopId)
    .eq("id", programId);

  if (error) throw error;
}
