import createClient from "../../../../supabase/server";
import type { ProgramRow, CampaignRow, ProgramGoalsRow,} from "../../types/dbTables";

// What the page will consume, regardless of the raw RPC shape:
export type GetShopSingleProgramResult = {
  program: ProgramRow | null;
  campaign: CampaignRow | null;         
  programGoals: ProgramGoalsRow[];      
  siblingPrograms: ProgramRow[];        
};

export async function getShopSingleProgram(shopsID: number, programId: number) {
  const supabase = createClient();

  console.log('[getShopSingleProgram] Calling RPC:', {
    function: 'get_shop_campaign_programs',
    params: {
      p_shops_id: shopsID,
      p_program_id: programId,
    },
    timestamp: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .rpc("get_shop_campaign_programs", { p_shops_id: shopsID, p_program_id: programId })
    .single(); 

  if (error) {
    console.error('[getShopSingleProgram] RPC Error:', {
      function: 'get_shop_campaign_programs',
      params: {
        p_shops_id: shopsID,
        p_program_id: programId,
      },
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to fetch program: ${error.message}`);
  }

  if (!data) {
    console.error('[getShopSingleProgram] No data returned:', {
      shopsID,
      programId,
      timestamp: new Date().toISOString(),
    });
    throw new Error('No data returned from database');
  }

  // Cast once at the top
  const raw = (data ?? {}) as any;

  console.log('[getShopSingleProgram] Success:', {
    shopsID,
    programId,
    hasProgram: !!raw.program,
    hasCampaign: !!(raw.campaigns || raw.campaign),
    hasProgramGoals: !!raw.programGoals,
    hasSiblingPrograms: !!raw.siblingPrograms,
    timestamp: new Date().toISOString(),
  });

  const campaign: CampaignRow | null = Array.isArray(raw.campaigns)
    ? (raw.campaigns[0] ?? null)
    : (raw.campaign ?? null);

  const programGoals: ProgramGoalsRow[] = Array.isArray(raw.programGoals)
    ? raw.programGoals
    : [];

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