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
  externalId?: string | null;           // optional
  active?: boolean;                     // default true
};

const toNull = (s?: string | null) => (s && s.trim() !== "" ? s : null);

export async function createCampaign(payload: CreateCampaignPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const insertRow = {
    shop: payload.shop,
    campaign_name: payload.campaignName,
    campaign_description: payload.description ?? "",
    code_prefix: payload.codePrefix ?? null,
    budget: payload.budget ?? 0,
    campaign_start_date: toNull(payload.startDate ?? null),
    campaign_end_date: toNull(payload.endDate ?? null),
    status: payload.status ?? "DRAFT",
    campaign_goals: payload.goals ?? [],
    is_default: payload.isDefault ?? false,
    external_id: payload.externalId ?? null,
    active: payload.active ?? true,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  return data;
}
