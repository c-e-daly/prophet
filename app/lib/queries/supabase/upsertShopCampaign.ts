// app/lib/queries/supabase/upsertShopCampaign.ts
import createClient from "../../../../supabase/server";
import type { CampaignRow, UpsertCampaignPayload } from "../../types/dbTables";

/**
 * Upsert a campaign via RPC function.
 * - If payload.id exists: updates that campaign
 * - If payload.id is missing: inserts new campaign
 */
export async function upsertShopCampaign(
  shopsID: number,
  payload: UpsertCampaignPayload
): Promise<CampaignRow> {
  const supabase = createClient();

  console.log(`Shops: ${shopsID}`,`Payload: ${payload}`)

  // Cast to any temporarily until types are regenerated
  const { data, error } = await (supabase.rpc as any)('upsert_shop_campaigns', {
    p_shops_id: shopsID,
    p_campaign_id: payload.id ?? null,
    p_name: payload.name,
    p_description: payload.description ?? null,
    p_code_prefix: payload.codePrefix ?? null,
    p_budget: payload.budget ?? 0,
    p_start_date: payload.startDate ?? null,
    p_end_date: payload.endDate ?? null,
    p_status: payload.status ?? 'Draft',
    p_goals: payload.goals ?? [],
    p_is_default: payload.isDefault ?? false,
  });

  if (error) {
    console.error('Error upserting campaign:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      shopsID,
      campaignId: payload.id,
      name: payload.name,
    });
    
    if (error.message?.includes('campaign_not_found')) {
      throw new Error('campaign_not_found');
    }
    if (error.message?.includes('cannot be blank')) {
      throw new Error('Campaign name is required');
    }
    throw new Error(`Failed to save campaign: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to save campaign - no data returned');
  }

  // Handle both array (setof) and single object returns
  const result = Array.isArray(data) ? data[0] : data;
  
  if (!result) {
    throw new Error('Failed to save campaign - empty result');
  }

  return result as CampaignRow;
}