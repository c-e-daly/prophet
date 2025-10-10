// app/lib/queries/supabase/upsertShopProgram.ts
import createClient from "../../../../supabase/server";
import type { ProgramRow, UpsertProgramPayload } from "../../types/dbTables";

/**
 * Upsert a program via RPC function.
 * - If payload.id exists: updates that program
 * - If payload.id is missing: inserts new program
 */
export async function upsertShopProgram(
  shopsID: number,
  payload: UpsertProgramPayload
): Promise<ProgramRow> {
  const supabase = createClient();

  // Cast to any temporarily until types are regenerated
  const { data, error } = await (supabase.rpc as any)('upsert_shop_programs', {
    p_shops_id: shopsID,
    p_program_id: payload.id ?? null,
    p_campaigns_id: payload.campaigns ?? null,
    p_name: payload.name,
    p_description: payload.description ?? null,
    p_start_date: payload.startDate ?? null,
    p_end_date: payload.endDate ?? null,
    p_status: payload.status ?? 'Draft',
    p_budget_goal: payload.budgetGoal ?? null,
    p_offer_goal: payload.offerGoal ?? null,
    p_revenue_goal: payload.revenueGoal ?? null,
    p_is_default: payload.isDefault ?? false,
  });

  if (error) {
    console.error('Error upserting program:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      shopsID,
      programId: payload.id,
      name: payload.name,
    });
    
    if (error.message?.includes('program_not_found')) {
      throw new Error('program_not_found');
    }
    if (error.message?.includes('cannot be blank')) {
      throw new Error('Program name is required');
    }
    throw new Error(`Failed to save program: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to save program - no data returned');
  }

  // Handle both array (setof) and single object returns
  const result = Array.isArray(data) ? data[0] : data;
  
  if (!result) {
    throw new Error('Failed to save program - empty result');
  }

  return result as ProgramRow;
}