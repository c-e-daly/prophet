// app/lib/queries/createShopCampaign.ts
import { createClient } from "../../utils/supabase/server";
import type { CampaignGoal, CampaignStatus } from "./enumTypes";

export type CreateCampaignPayload = {
  shop: number;
  campaignName: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;     // dollars
  startDate?: string | null;  // ISO
  endDate?: string | null;    // ISO
  status?: CampaignStatus;    // e.g. "Draft"
  campaignGoals?: CampaignGoal[];     // <-- jsonb on campaigns
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
  campaignGoals: CampaignGoal[] | null;  // <-- jsonb
  created_at: string;
  modifiedDate: string;
};

const toNull = (s?: string | null) => (s && s.trim() !== "" ? s : null);
const fmtErr = (e: any) =>
  e ? `${e.message ?? "unknown"} | code=${e.code ?? ""} details=${e.details ?? ""} hint=${e.hint ?? ""}` : "unknown";

/** Single-shot insert: campaign core + goals (jsonb). */
export async function createCampaign(payload: CreateCampaignPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const row = {
    shop: payload.shop,
    campaignName: payload.campaignName,
    description: payload.description ?? "",
    codePrefix: payload.codePrefix ?? null,
    budget: payload.budget ?? 0,
    startDate: toNull(payload.startDate ?? null),
    endDate: toNull(payload.endDate ?? null),
    status: payload.status ?? "Draft",  // store exactly as provided
    isDefault: payload.isDefault ?? false,
    campaignGoals: payload.campaignGoals ?? [],         // <-- jsonb column
    created_at: nowIso,
    modifiedDate: nowIso,
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(row)
    .select("*")
    .single<DbCampaignRow>();

  if (error) throw new Error(`Failed to create campaign: ${fmtErr(error)}`);
  return data;
}
