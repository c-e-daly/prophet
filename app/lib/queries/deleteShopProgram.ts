// app/lib/queries/deleteProgram.ts
import createClient from "../../utils/supabase/admin";
const supabase = createClient();

export async function deleteShopProgram(shopId: number, programId: number) {
  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("shop", shopId)
    .eq("id", programId);

  if (error) throw error;
}
