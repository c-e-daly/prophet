import createClient from "../../../../supabase/admin";
import type {Tables} from "../../types/dbTables";

type Campaign = Tables<"campaigns">;
const supabase = createClient();

export async function getShopSingleCampaign(shopsID: number, campaignsID: number): Promise<Campaign> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("shops", shopsID)
    .eq("id", campaignsID)
    .single();

  if (error || !data) throw new Error("campaign_not_found");
  return data as Campaign;
}
