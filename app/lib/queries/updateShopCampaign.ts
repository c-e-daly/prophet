// app/lib/queries/updateShopCampaign.ts
import { createClient } from "../../utils/supabase/server";

type CampaignGoal = { type: string; metric: string; value: number };

type UpdatePayload = {
  id: number;
  shop: string; // shop domain
  campaignName: string;
  campaignDescription?: string;
  codePrefix?: string;
  budget?: number;
  campaignStartDate?: string | null;
  campaignEndDate?: string | null;
  campaignGoals?: CampaignGoal[];
  active?: boolean;
};

export async function updateShopCampaign(payload: UpdatePayload) {
  const supabase = createClient();

  const { data: shopRow, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", payload.shop)
    .single();
  if (shopErr || !shopRow) throw new Error("shop_not_found");

  const { error } = await supabase
    .from("campaigns")
    .update({
      campaign_name: payload.campaignName,
      campaign_description: payload.campaignDescription ?? "",
      code_prefix: payload.codePrefix ?? "",
      budget: payload.budget ?? 0,
      campaign_start_date: payload.campaignStartDate ?? null,
      campaign_end_date: payload.campaignEndDate ?? null,
      campaign_goals: payload.campaignGoals ?? [],
      active: payload.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("shop", shopRow.id)
    .eq("id", payload.id);

  if (error) throw new Error(`Failed to update campaign: ${error.message}`);
}
