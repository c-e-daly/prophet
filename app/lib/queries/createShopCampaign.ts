// app/lib/queries/createShopCampaign.ts
import { createClient } from "../../utils/supabase/server";
import type { Inserts, Tables, Enum } from "./types/dbTables";

// Pull enum straight from generated types
type CampaignStatus = Enum<"campaignStatus">;

export type CreateCampaignPayload = {
  shop: number;
  campaignName: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;     // dollars
  startDate?: string | null;  // ISO
  endDate?: string | null;    // ISO
  status?: CampaignStatus;    // "Draft" | "Active" | ...
  campaignGoals?: Inserts<"campaigns">["campaignGoals"]; // use the exact Json type
  isDefault?: boolean;
};

type CampaignInsert = Inserts<"campaigns">;
type CampaignRow    = Tables<"campaigns">;

const ensureString = (v?: string | null, fallback = ""): string =>
  v && v.trim() !== "" ? v : fallback;

export async function createCampaign(payload: CreateCampaignPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // Build the row using each column's generated type to satisfy nullability
  const row: CampaignInsert = {
    shop: payload.shop,
    campaignName: ensureString(payload.campaignName),       // string (non-null)
    description: ensureString(payload.description ?? ""),    // if column is string (not nullable)
    codePrefix: ensureString(payload.codePrefix ?? ""),      // if column is string (not nullable)
    budget: payload.budget ?? 0,                             // number (non-null)
    // If your columns are nullable, keep `?? null`; if not, coerce to empty string/date as needed.
    startDate: (payload.startDate ?? null) as CampaignInsert["startDate"],
    endDate:   (payload.endDate   ?? null) as CampaignInsert["endDate"],
    status: (payload.status ?? "Draft") as CampaignInsert["status"], // 💡 default must match enum casing
    isDefault: payload.isDefault ?? false,
    campaignGoals:
      (payload.campaignGoals ?? []) as CampaignInsert["campaignGoals"], // Json type, not {}
    created_at: nowIso as CampaignInsert["created_at"],
    modifiedDate: nowIso as CampaignInsert["modifiedDate"],
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(row)
    .select("*")
    .single<CampaignRow>();

  if (error) {
    const fmt = `${error.message ?? "unknown"} | code=${error.code ?? ""} details=${error.details ?? ""} hint=${error.hint ?? ""}`;
    throw new Error(`Failed to create campaign: ${fmt}`);
  }
  return data;
}
