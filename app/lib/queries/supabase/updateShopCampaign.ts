// app/lib/queries/supabase/updateShopCampaign.ts
import createClient from "../../../../supabase/server";
import type { Tables, Enum } from "../../types/dbTables";

type CampaignStatus = Enum<"campaignStatus">;

export type UpdateCampaignPayload = {
  campaignName?: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number;
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

/*
// app/lib/queries/updateShopCampaign.ts
import createClient from "../../../../supabase/server";

type CampaignGoal = { type: string; metric: string; value: number };

export type UpdateCampaignPayload = {
  campaignsID: number;
  shopsID: number; // direct tenant guard
  campaignName: string;
  description?: string;
  codePrefix?: string;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  campaignGoals?: CampaignGoal[];
  active?: boolean;
  status?: "Draft" | "Pending" | "Active" | "Paused" | "Complete" | "Archived";
  modifiedDate: string | null;
};

export async function updateShopCampaign(payload: UpdateCampaignPayload) {
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
      stauts: payload,
      modifiedDate: new Date().toISOString(),
      status: payload.status ?? "Draft"
    })
    .eq("shops", payload.shopsID)
    .eq("id", payload.campaignsID);

  if (error) throw new Error(`failed_update_campaign:${error.message}`);
}
*/