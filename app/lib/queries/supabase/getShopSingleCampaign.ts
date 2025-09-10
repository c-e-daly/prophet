import createClient from "../../../utils/supabase/admin";
import type {Tables} from "../../types/dbTables";

type Campaign = Tables<"campaigns">;
const supabase = createClient();

export async function getShopCampaignForEdit(shopId: number, campaignId: number): Promise<Campaign> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("shop", shopId)
    .eq("id", campaignId)
    .single();

  if (error || !data) throw new Error("campaign_not_found");
  return data as Campaign;
}
