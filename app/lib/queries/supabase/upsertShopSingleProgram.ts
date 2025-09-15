// app/lib/queries/updateShopProgram.ts
import  createClient  from "../../../../supabase/server";
import type { Inserts, Enum, Tables} from "../../types/dbTables";

type Program  = Tables<"programs">;
type ProgramStatus = Enum<"programStatus">;
type ProgramFocus  = Enum<"programFocus">;

export type baseData = {
  programs: number;         // programs.id (PK)
  shopsID: number;            // shops.id
  campaigns: number;        // campaigns.id (FK)
  programName: string;
  status?: ProgramStatus;
  startDate?: string | null;
  endDate?: string | null;
  codePrefix?: string | null;
  programFocus?: ProgramFocus | null;
  expiryTimeMinutes?: number | null;
  combineOrderDiscounts?: boolean | null;
  combineProductDiscounts?: boolean | null;
  combineShippingDiscounts?: boolean | null;
  isDefault?: boolean | null;
  acceptRate?: number | null;
  declineRate?: number | null;
  modifiedData?: string | null;
};

export async function upsertShopSingleProgram(payload: baseData) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // quick guards
  if (!payload.programs) throw new Error("Missing program id");
  if (!payload.shopsID)    throw new Error("Missing shop id");
  if (!payload.campaigns) throw new Error("Missing campaign id");
  if (!payload.programName?.trim()) throw new Error("programName is required");
  if (payload.startDate && payload.endDate) {
    const s = Date.parse(payload.startDate);
    const e = Date.parse(payload.endDate);
    if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
      throw new Error("endDate must be on/after startDate");
    }
  }

  const row: Partial<Inserts<"programs">> & { id: number } = {
    id: payload.programs,           
    shops: payload.shopsID,
    campaigns: payload.campaigns,
    programName: payload.programName.trim(),
    status: (payload.status ?? "Draft") as Inserts<"programs">["status"],
    startDate: payload.startDate ?? null,
    endDate: payload.endDate ?? null,
    codePrefix: payload.codePrefix ?? null,
    programFocus: (payload.programFocus ?? null) as Inserts<"programs">["programFocus"],
    expiryTimeMinutes: payload.expiryTimeMinutes ?? null,
    combineOrderDiscounts: payload.combineOrderDiscounts ?? false,
    combineProductDiscounts: payload.combineProductDiscounts ?? false,
    combineShippingDiscounts: payload.combineShippingDiscounts ?? false,
    isDefault: payload.isDefault ?? false,
    acceptRate: payload.acceptRate ?? null,
    declineRate: payload.declineRate ?? null,
    modifiedDate: nowIso,
  };

  const { data, error } = await supabase
    .from("programs")
    .upsert(row, { onConflict: "id" })
    .select("id")
    .single();

  if (error) throw new Error(error.message || "program_update_failed");
  return data?.id;
}
