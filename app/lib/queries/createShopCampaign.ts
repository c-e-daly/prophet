// app/lib/queries/createShopCampaign.ts
import { createClient } from "../../utils/supabase/server";
import type { CampaignGoal, CampaignStatus } from "../queries/types";

export type CreateCampaignPayload = {
  shop: number;
  campaignName: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;               // dollars
  startDate?: string | null;            // ISO
  endDate?: string | null;              // ISO
  status?: CampaignStatus;              // default DRAFT
  goals?: CampaignGoal[];               // jsonb
  isDefault?: boolean;                  // default false
}

const toNull = (s?: string | null) => (s && s.trim() !== "" ? s : null);

export async function createCampaign(payload: CreateCampaignPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const insertRow = {
    shop: payload.shop,
    campaignName: payload.campaignName,
    description: payload.description ?? "",
    codePrefix: payload.codePrefix ?? null,
    budget: payload.budget ?? 0,
    startDate: toNull(payload.startDate ?? null),
    endDate: toNull(payload.endDate ?? null),
    status: payload.status ?? "DRAFT",
    campaignGoals: payload.goals ?? [],
    isDefault: payload.isDefault ?? false,
    created_at: nowIso,
    modifiedDate: nowIso,
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  return data;
}
