// app/lib/queries/updateShopCampaign.ts
import createClient from "../../../../supabase/server";

type CampaignGoal = { type: string; metric: string; value: number };

export type UpdateCampaignPayload = {
  id: number;
  shopsID: number; // direct tenant guard
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
    .eq("shops", payload.shopsID)
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