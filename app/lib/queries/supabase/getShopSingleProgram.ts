// app/lib/queries/supabase/getShopSingleProgram.ts
import createClient from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

type Program = Tables<"programs">;
type Campaign = Pick<Tables<"campaigns">, "id" | "name">;

type RpcResponse = {
  program: Program;
  campaigns: Campaign[];
};

export async function getShopSingleProgram(
  shopsID: number,
  programsID: number
): Promise<{ program: Program; campaigns: Campaign[] }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_campaign_single_program', {
    p_shops_id: shopsID,
    p_programs_id: programsID,
  });

  if (error) {
    console.error('Error fetching program:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      shopsID,
      programsID,
    });
    
    // Match original error messages
    if (error.message?.includes('program_not_found')) {
      throw new Error('program_not_found');
    }
    throw new Error(error.message || 'Failed to load program');
  }

  if (!data) {
    throw new Error('program_not_found');
  }

  // Type assertion since RPC returns jsonb
  const result = data as unknown as RpcResponse;

  return {
    program: result.program,
    campaigns: result.campaigns || [],
  };
}