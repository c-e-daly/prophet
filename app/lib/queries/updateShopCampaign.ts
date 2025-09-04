// app/lib/queries/updateShopCampaign.ts
import { createClient } from "../../utils/supabase/server";

type CampaignGoal = { type: string; metric: string; value: number };

export type UpdateCampaignPayload = {
  id: number;
  shopsId: number; // direct tenant guard
  campaignName: string;
  description?: string;
  codePrefix?: string;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  campaignGoals?: CampaignGoal[];
  active?: boolean;
};

export async function updateShopCampaignById(payload: UpdateCampaignPayload) {
  const supabase = createClient();

  const { error } = await supabase
    .from("campaigns")
    .update({
      campaignName: payload.campaignName,
      description: payload.description ?? "",
      codePrefix: payload.codePrefix ?? "",
      budget: payload.budget === null ? null : payload.budget ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      campaignGoals: payload.campaignGoals ?? [],
      active: payload.active ?? true,
      modifiedDate: new Date().toISOString(),
    })
    .eq("shop", payload.shopsId)
    .eq("id", payload.id);

  if (error) throw new Error(`failed_update_campaign:${error.message}`);
}

/**
 * Legacy export kept for compatibility if anything else calls it.
 * Prefer updateShopCampaignById going forward.
 */
export async function updateShopCampaign(input: {
  id: number;
  shop: string; // deprecated path (shopDomain)
  campaignName: string;
  description?: string;
  codePrefix?: string;
  budget?: number;
  startDate?: string | null;
  endDate?: string | null;
  campaignGoals?: CampaignGoal[];
  active?: boolean;
}) {
  // This wrapper can be removed once all callers switch to the shopsId API.
  throw new Error(
    "updateShopCampaign(shopDomain) is deprecated. Use updateShopCampaignById({ shopsId, ... })"
  );
}


/*
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
    .eq("shopDomain", payload.shop)
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

*/
