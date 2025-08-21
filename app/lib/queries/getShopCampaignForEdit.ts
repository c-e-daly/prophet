// app/lib/queries/getCampaignForEdit.ts
import { createClient } from "../../utils/supabase/server";

export async function getCampaignForEdit(shopDomain: string, campaignId: number) {
  const supabase = createClient();

  // Resolve shop.id
  const { data: shopRow, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", shopDomain)
    .single();
  if (shopErr || !shopRow) throw new Error("shop_not_found");

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, shop, campaign_name, campaign_description, code_prefix, budget, campaign_start_date, campaign_end_date, campaign_goals, active, external_id, created_at, updated_at"
    )
    .eq("shop", shopRow.id)
    .eq("id", campaignId)
    .single();

  if (error || !data) throw new Error("campaign_not_found");
  return data;
}
