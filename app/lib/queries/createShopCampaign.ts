// app/lib/queries/createShopCampaign.ts
import { createClient } from "../../utils/supabase/server";
import type { CampaignGoal, CampaignStatus } from "./types";

export type CreateCampaignPayload = {
  shop: number;
  campaignName: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;     // dollars
  startDate?: string | null;  // ISO
  endDate?: string | null;    // ISO
  status?: CampaignStatus;    // e.g. "Draft"
  goals?: CampaignGoal[];     // inserted after core
  isDefault?: boolean;
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
const fmtErr = (e: any) =>
  e ? `${e.message ?? "unknown"} | code=${e.code ?? ""} details=${e.details ?? ""} hint=${e.hint ?? ""}` : "unknown";

/** 1) Insert core campaign (no goals). Returns inserted campaign row. */
export async function createCampaignCore(payload: CreateCampaignPayload) {
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
    status: payload.status ?? "Draft",        // ← keep as-is (no uppercasing)
    isDefault: payload.isDefault ?? false,
    created_at: nowIso,
    modifiedDate: nowIso,
  };

  const { data, error } = await createClient()
    .from("campaigns")
    .insert(insertRow)
    .select("*")
    .single<DbCampaignRow>();

  if (error) throw new Error(`Failed to create campaign: ${fmtErr(error)}`);
  return data;
}

/** 2) Insert goals for a given campaign id (no rollback of the campaign). */
export async function insertCampaignGoals(
  campaignId: number,
  goals: CampaignGoal[] | undefined
) {
  if (!goals || goals.length === 0) return [];

  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const rows = goals.map((g) => ({
    campaign: campaignId,         // FK to campaigns.id
    goal: g.goal,                 // from unions in ./types
    goalMetric: g.metric,             // "absolute" | "percent" | "units"
    goalValue: g.value,
    created_at: nowIso,
    modifiedDate: nowIso,
  }));

  // Plain insert (safe on create). If you later add a unique index on (campaign,type,metric),
  // you can switch to .upsert(rows, { onConflict: 'campaign,type,metric' })
  const { data, error } = await supabase
    .from("campaign_goals")
    .insert(rows)
    .select("*");

  if (error) throw new Error(`Failed to insert campaign goals: ${fmtErr(error)}`);
  return data;
}

/** Convenience: create campaign, then (best effort) insert goals. */
export async function createCampaign(payload: CreateCampaignPayload) {
  const campaign = await createCampaignCore(payload);

  // Don’t roll back the campaign if goals fail.
  if (payload.goals && payload.goals.length > 0) {
    try {
      await insertCampaignGoals(campaign.id, payload.goals);
    } catch (err) {
      // Surface the error, but leave the campaign intact.
      console.error("insertCampaignGoals error:", err);
      // You can decide whether to rethrow or swallow:
      // throw err;
    }
  }

  return campaign;
}
