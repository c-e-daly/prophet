// app/lib/queries/supabase/getShopSingleCampaign.ts
import createClient from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

type Campaign = Tables<"campaigns">;

export async function getShopSingleCampaign(
  shopsID: number,
  campaignsID: number
): Promise<Campaign> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_single_campaign', {
    p_shops_id: shopsID,
    p_campaigns_id: campaignsID,
  });

  if (error) {
    console.error('Error fetching campaign:', {
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
    throw new Error('campaign_not_found');
  }

  return data as Campaign;
}