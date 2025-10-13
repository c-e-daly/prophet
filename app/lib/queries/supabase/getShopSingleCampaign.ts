// app/lib/queries/supabase/getShopSingleCampaign.ts
import createClient from "../../../../supabase/server";
import type { CampaignRow, ProgramRow } from "../../types/dbTables";

export type CampaignWithPrograms = {
  campaign: CampaignRow;
  programs: ProgramRow[];
};

/**
 * Fetch a single campaign with all its child programs.
 * Used for edit/detail views.
 */
export async function getShopSingleCampaign(
  shopsID: number,
  campaignsID: number
): Promise<CampaignWithPrograms> {
  const supabase = createClient();

  console.log('[getShopSingleCampaign] Calling RPC:', {
    shopsID,
    campaignsID,
  });

  const { data, error } = await supabase.rpc('get_shop_single_campaign', {
    p_shops_id: shopsID,
    p_campaigns_id: campaignsID,
  });

  if (error) {
    console.error('[getShopSingleCampaign] Error from RPC:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      shopsID,
      campaignsID,
    });
    
    if (error.message?.includes('campaign_not_found')) {
      throw new Error('campaign_not_found');
    }
    throw new Error(error.message || 'Failed to load campaign');
  }

  if (!data) {
    console.error('[getShopSingleCampaign] No data returned from RPC');
    throw new Error('campaign_not_found');
  }

  // RPC returns jsonb with structure: { campaign: {...}, programs: [...] }
  const result = data as unknown as CampaignWithPrograms;

  console.log('[getShopSingleCampaign] Success:', {
    campaignId: result.campaign.id,
    campaignName: result.campaign.name,
    programsCount: result.programs.length,
  });

  return result;
}