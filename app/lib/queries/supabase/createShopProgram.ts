// app/lib/queries/createShopProgram.ts
// app/lib/queries/createShopProgram.ts
import createClient from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";

type ProgramStatus = Enum<"programStatus">;
type ProgramFocus = Enum<"programFocus"> | null;

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
  combineShippingDiscounts?: boolean | null;
  isDefault?: boolean | null;
  acceptRate?: number | null;     
  declineRate?: number | null;
  createdBy?: string | null;
};

type ProgramInsert = Inserts<"programs">;
type ProgramRow = Tables<"programs">;

const ensureString = (v?: string | null, fallback = ""): string =>
  v && v.trim() !== "" ? v : fallback;

// Helper to handle datetime-local format conversion
const formatDateTime = (dateStr?: string | null): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  
  try {
    // If it's already in ISO format, return as is
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      return dateStr;
    }
    
    // If it's from datetime-local input (YYYY-MM-DDTHH:MM), convert to ISO
    if (dateStr.includes('T')) {
      return new Date(dateStr).toISOString();
    }
    
    // Otherwise try to parse and convert
    return new Date(dateStr).toISOString();
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`, error);
    return null;
  }
};

export async function createShopProgram(payload: CreateProgramPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  console.log("=== CREATE PROGRAM PAYLOAD ===");
  console.log(JSON.stringify(payload, null, 2));

  // Light validation to catch obvious issues before DB constraints fire
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
    shops: payload.shop,
    campaigns: payload.campaign,
    programName: ensureString(payload.programName),
    status: (payload.status ?? "Draft") as ProgramInsert["status"],
    startDate: formatDateTime(payload.startDate) as ProgramInsert["startDate"],
    endDate: formatDateTime(payload.endDate) as ProgramInsert["endDate"],
    codePrefix: payload.codePrefix && payload.codePrefix.trim() !== "" ? payload.codePrefix : null,
    programFocus: payload.programFocus || null,
    expiryTimeMinutes: payload.expiryTimeMinutes ?? 60,
    combineOrderDiscounts: payload.combineOrderDiscounts ?? false,
    combineProductDiscounts: payload.combineProductDiscounts ?? false,
    combineShippingDiscounts: payload.combineShippingDiscounts ?? false,
    isDefault: payload.isDefault ?? false,
    acceptRate: payload.acceptRate ?? null,
    declineRate: payload.declineRate ?? null,
    createdBy: payload.createdBy ?? null, // Changed from "system" to null
    created_at: nowIso as ProgramInsert["created_at"],
    modifiedDate: nowIso as ProgramInsert["modifiedDate"],
  };

  console.log("=== FINAL ROW TO INSERT ===");
  console.log(JSON.stringify(row, null, 2));

  try {
    const { data, error } = await supabase
      .from("programs")
      .insert(row)
      .select("*")
      .single<ProgramRow>();

    if (error) {
      console.error("=== SUPABASE INSERT ERROR ===");
      console.error("Error:", error);
      console.error("Row that failed:", JSON.stringify(row, null, 2));
      
      const fmt = `${error.message ?? "unknown"} | code=${error.code ?? ""} details=${error.details ?? ""} hint=${error.hint ?? ""}`;
      throw new Error(`Failed to create program: ${fmt}`);
    }

    console.log("=== INSERT SUCCESS ===");
    console.log("Created program:", data);
    return data;
    
  } catch (dbError) {
    console.error("=== DATABASE ERROR ===");
    console.error(dbError);
    throw dbError;
  }
}
/*
import createClient from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";

type ProgramStatus = Enum<"programStatus">;
type ProgramFocus = Enum<"programFocus"> | null;

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
    shops: payload.shop,
    campaigns: payload.campaign,
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
    const fmt = `${error.message ?? "unknown"} | code=${error.code ?? ""} 
    details=${error.details ?? ""} hint=${error.hint ?? ""}`;
    throw new Error(`Failed to create program: ${fmt}`);
  }
  return data;
}
*/