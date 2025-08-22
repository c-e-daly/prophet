// app/lib/queries/createShopCampaign.ts
import { createClient } from "../../utils/supabase/server";
import type { CampaignGoal, CampaignStatus } from "./types"; // same folder

export type CreateCampaignPayload = {
  shop: number;
  campaignName: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;               // dollars
  startDate?: string | null;            // ISO
  endDate?: string | null;              // ISO
  status?: CampaignStatus;              // "Draft" | "Active" | ...
  goals?: CampaignGoal[];               // optional; inserted after core
  isDefault?: boolean;                  // default false           // optional           // default true
};

type DbCampaignRow = {
  id: number;
  shop: number;
  campaignName: string;
  description: string | null;
  codePrefix: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  isDefault: boolean;
  created_at: string;
  modifiedDate: string;
};

const toNull = (s?: string | null) => (s && s.trim() !== "" ? s : null);

/** 1) Insert core campaign (no goals). Returns inserted campaign row. */
export async function createCampaignCore(payload: CreateCampaignPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const insertRow = {
    shop: payload.shop,
    campaignName: payload.campaignName,
    description: payload.description ?? "",
    codePrefix: payload.codePrefix ?? null,
    budget: payload.budget ?? 0, // dollars
    startDate: toNull(payload.startDate ?? null),
    endDate: toNull(payload.endDate ?? null),
    status: payload.status,
    isDefault: payload.isDefault ?? false,
    created_at: nowIso,
    modifiedDate: nowIso,
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(insertRow)
    .select("*")
    .single<DbCampaignRow>();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  return data;
}

/** 2) Insert campaign goals for a given campaign id. */
export async function insertCampaignGoals(
  campaignId: number,
  goals: CampaignGoal[] | undefined
) {
  if (!goals || goals.length === 0) return [];

  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // assumes a table named "campaign_goals" with columns:
  // campaign (FK -> campaigns.id), type, metric, value, created_at, updated_at
  const rows = goals.map((g) => ({
    campaign: campaignId,
    type: g.type,       // string union from types.ts
    metric: g.metric,   // "absolute" | "percent" | "units"
    value: g.value,     // number
    created_at: nowIso,
    modifiedDate: nowIso,
  }));

  const { data, error } = await supabase
    .from("campaign_goals")
    .insert(rows)
    .select("*");

  if (error) throw new Error(`Failed to insert campaign goals: ${error.message}`);
  return data;
}

/** Convenience: create campaign, then goals. Rolls back campaign if goals fail. */
export async function createCampaign(payload: CreateCampaignPayload) {
  const campaign = await createCampaignCore(payload);

  try {
    await insertCampaignGoals(campaign.id, payload.goals);
  } catch (err) {
    // simple rollback to keep things tidy if goal insert fails
    const supabase = createClient();
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    throw err;
  }

  return campaign;
}
