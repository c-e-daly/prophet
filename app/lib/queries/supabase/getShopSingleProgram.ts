import createClient from "../../../../supabase/server";
import type { ProgramRow, CampaignRow, ProgramGoalsRow,} from "../../types/dbTables";

// What the page will consume, regardless of the raw RPC shape:
export type GetShopSingleProgramResult = {
  program: ProgramRow | null;
  campaign: CampaignRow | null;          // <- normalized singular
  programGoals: ProgramGoalsRow[];       // <- always array
  siblingPrograms: ProgramRow[];         // <- always array (empty if not provided)
};

export async function getShopSingleProgram(shopsID: number, programId: number) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc("get_shop_campaign_single_program", { p_shops_id: shopsID, p_programs_id: programId })
    .single(); // the RPC returns one JSON object

  if (error) throw error;
  const raw = (data ?? {}) as any;

  // Accept both shapes:
  // - raw.campaign (ideal)
  // - raw.campaigns: CampaignRow[]  (current)
  const campaign: CampaignRow | null = Array.isArray(raw.campaigns)
    ? (raw.campaigns[0] ?? null)
    : (raw.campaign ?? null);

  // Goals: prefer raw.programGoals (array); otherwise,  []
  const programGoals: ProgramGoalsRow[] = Array.isArray(raw.programGoals)
    ? raw.programGoals
    : [];

  // Siblings: prefer raw.siblingPrograms (array); else derive from raw.programs if present; else []
  const siblingPrograms: ProgramRow[] = Array.isArray(raw.siblingPrograms)
    ? raw.siblingPrograms
    : Array.isArray(raw.programs)
      ? (raw.programs as ProgramRow[]).filter((p) => raw.program && p.id !== raw.program.id)
      : [];

  return {
    program: (raw.program ?? null) as ProgramRow | null,
    campaign,
    programGoals,
    siblingPrograms,
  } satisfies GetShopSingleProgramResult;
}
