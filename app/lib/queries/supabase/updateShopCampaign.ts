// app/lib/queries/supabase/updateShopCampaign.ts
import createClient from "../../../../supabase/server";
import type { Tables, Enum } from "../../types/dbTables";

type CampaignStatus = Enum<"campaignStatus">;

export type UpdateCampaignPayload = {
  campaignName?: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: CampaignStatus;
  campaignGoals?: Array<{ goal: string; metric: string; value: number }>;
  isDefault?: boolean;
};

export async function updateShopCampaign(
  shopsId: number,
  campaignId: number,
  payload: UpdateCampaignPayload
) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // Build update object only with provided fields
  const updateData: Record<string, any> = {
    modifiedDate: nowIso,
  };

  if (payload.campaignName !== undefined) updateData.campaignName = payload.campaignName;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.codePrefix !== undefined) updateData.codePrefix = payload.codePrefix;
  if (payload.budget !== undefined) updateData.budget = payload.budget;
  if (payload.startDate !== undefined) updateData.startDate = payload.startDate;
  if (payload.endDate !== undefined) updateData.endDate = payload.endDate;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.campaignGoals !== undefined) updateData.campaignGoals = payload.campaignGoals;
  if (payload.isDefault !== undefined) updateData.isDefault = payload.isDefault;

  const { data, error } = await supabase
    .from("campaigns")
    .update(updateData)
    .eq("shops", shopsId)
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) {
    const fmt = `${error.message ?? "unknown"} | code=${error.code ?? ""} details=${error.details ?? ""} hint=${error.hint ?? ""}`;
    throw new Error(`Failed to update campaign: ${fmt}`);
  }

  return data;
}