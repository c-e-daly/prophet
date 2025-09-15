// app/lib/queries/getShopSingleProgram.ts
import createClient from "../../../../supabase/admin";
import type { Tables } from "../../types/dbTables";

type Program  = Tables<"programs">;
type Campaign = Pick<Tables<"campaigns">, "id" | "campaignName">;

const supabase = createClient();

export async function getShopSingleProgram(shopsID: number, programsID: number) {
  const [{ data: program, error: pErr }, { data: campaigns, error: cErr }] = await Promise.all([
    supabase
      .from("programs")
      .select("*")
      .eq("shops", shopsID)
      .eq("id", programsID)
      .single<Program>(),
    supabase
      .from("campaigns")
      .select("id, campaignName")
      .eq("shops", shopsID)
      .neq("status", "Archived")
      .order("campaignName", { ascending: true }) as any as Promise<{
        data: Campaign[] | null; error: any;
      }>,
  ]);

  if (pErr || !program) throw new Error("program_not_found");
  if (cErr) throw new Error(cErr.message || "campaigns_load_failed");

  return { program, campaigns: campaigns ?? [] };
}
