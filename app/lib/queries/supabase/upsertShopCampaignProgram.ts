// app/lib/queries/supabase/upsertShopProgram.ts
import createClient from "../../../../supabase/server";
import type { ProgramRow, UpsertProgramPayload } from "../../types/dbTables";

export async function upsertShopProgram(
  shopsID: number,
  payload: UpsertProgramPayload
): Promise<ProgramRow> {
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)('upsert_shop_campaign_program', {
    p_program_id: payload.id ?? null,
    p_shops_id: shopsID,
    p_campaigns_id: payload.campaigns ?? null,
    p_name: payload.name,
    p_status: payload.status ?? 'Draft',
    p_start_date: payload.startDate ?? null,
    p_end_date: payload.endDate ?? null,
    p_code_prefix: payload.codePrefix ?? null,
    p_focus: payload.focus ?? null,
    p_description: payload.description ?? null,
    p_expiry_minutes: payload.expiryMinutes ?? 60,
    p_combine_order_discounts: payload.combineOrderDiscounts ?? false,
    p_combine_product_discounts: payload.combineProductDiscounts ?? false,
    p_combine_shipping_discounts: payload.combineShippingDiscounts ?? false,
    p_is_default: payload.isDefault ?? false,
    p_accept_rate: payload.acceptRate ?? null,
    p_decline_rate: payload.declineRate ?? null,
    p_goal_type: payload.goalType ?? null,
    p_goal_metric: payload.goalMetric ?? null,
    p_goal_value: payload.goalValue ?? null,
    p_created_by_user: payload.createdByUser ?? null,
    p_created_by_user_name: payload.createdByUserName ?? null,
  });

  if (error) {
    console.error('[upsertShopProgram] Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      shopsID,
      programId: payload.id,
      campaignId: payload.campaigns,
      programName: payload.name,
      timestamp: new Date().toISOString(),
    });
    
    // Handle specific error cases
    if (error.message?.includes('Invalid or missing shop id')) {
      throw new Error('Invalid shop ID');
    }
    if (error.message?.includes('Invalid or missing campaign id')) {
      throw new Error('Invalid campaign ID');
    }
    if (error.message?.includes('Program name is required')) {
      throw new Error('Program name is required');
    }
    if (error.message?.includes('End date must be on or after start date')) {
      throw new Error('End date must be on or after start date');
    }
    if (error.message?.includes('does not belong to this shop')) {
      throw new Error('Program does not belong to this shop');
    }
    
    throw new Error(`Failed to save program: ${error.message}`);
  }

  if (!data) {
    console.error('[upsertShopProgram] No data returned:', {
      shopsID,
      programId: payload.id,
      programName: payload.name,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Failed to save program - no data returned');
  }

  return data as ProgramRow;
}