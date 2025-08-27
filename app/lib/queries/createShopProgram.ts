// app/lib/queries/createShopProgram.ts
import { createClient } from "../../utils/supabase/server";
import type { Inserts, Tables, Enum } from "../types/dbTables";

type ProgramStatus = Enum<"programStatus">;
type ProgramFocus = Enum<"goal"> | null;

export type CreateProgramPayload = {
  shop: number;
  campaign: number;               
  programName: string;
  status?: ProgramStatus;        
  startDate?: string | null;      
  endDate?: string | null;        
  codePrefix?: string | null;
  programFocus?: ProgramFocus;
  expiryTimeMinutes?: number | null;
  combineOrderDiscounts?: boolean | null;
  combineProductDiscounts?: boolean | null;
  combineShippingDiscounts?: boolean | null;  isDefault?: boolean | null;
  acceptRate?: number | null;     
  declineRate?: number | null;
  createdBy?: string | null;
};

type ProgramInsert = Inserts<"programs">;
type ProgramRow    = Tables<"programs">;

const ensureString = (v?: string | null, fallback = ""): string =>
  v && v.trim() !== "" ? v : fallback;

export async function createShopProgram(payload: CreateProgramPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // light validation to catch obvious issues before DB constraints fire
  if (!payload.shop || payload.shop <= 0) {
    throw new Error("Invalid shop id.");
  }
  if (!payload.campaign || payload.campaign <= 0) {
    throw new Error("A valid campaign id is required.");
  }
  if (!payload.programName || payload.programName.trim() === "") {
    throw new Error("programName is required.");
  }
  if (payload.startDate && payload.endDate) {
    const s = Date.parse(payload.startDate);
    const e = Date.parse(payload.endDate);
    if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
      throw new Error("endDate must be on/after startDate.");
    }
  }

  // Build the row using generated types to satisfy nullability exactly
  const row: ProgramInsert = {
    shop: payload.shop,
    campaign: payload.campaign,
    programName: ensureString(payload.programName),
    status: (payload.status ?? "Draft") as ProgramInsert["status"],
    startDate: (payload.startDate ?? null) as ProgramInsert["startDate"],
    endDate: (payload.endDate ?? null) as ProgramInsert["endDate"],
    codePrefix: ensureString(payload.codePrefix ?? ""),
    programFocus: (payload.programFocus ?? null) as ProgramInsert["programFocus"],
    expiryTimeMinutes:
      (payload.expiryTimeMinutes ?? 60) as ProgramInsert["expiryTimeMinutes"],
    combineOrderDiscounts: payload.combineOrderDiscounts ?? false,
    combineProductDiscounts: payload.combineProductDiscounts ?? false,
    combineShippingDiscounts: payload.combineShippingDiscounts ?? false,
    isDefault: payload.isDefault ?? false,
    acceptRate: payload.acceptRate ?? null,
    declineRate: payload.declineRate ?? null,
    createdBy: payload.createdBy ?? "system",
    created_at: nowIso as ProgramInsert["created_at"],
    modifiedDate: nowIso as ProgramInsert["modifiedDate"],
  };

  const { data, error } = await supabase
    .from("programs")
    .insert(row)
    .select("*")
    .single<ProgramRow>();

  if (error) {
    const fmt = `${error.message ?? "unknown"} | code=${error.code ?? ""} details=${error.details ?? ""} hint=${error.hint ?? ""}`;
    throw new Error(`Failed to create program: ${fmt}`);
  }
  return data;
}
