// app/lib/queries/supabase/getShopPendingCampaigns.ts
import createClient from "../../../../supabase/server";
import type { CampaignRow } from "../../types/dbTables";

export async function getShopPendingCampaigns(shopsID: number): Promise<CampaignRow[]> {
  const supabase = createClient();

  console.log('[getShopPendingCampaigns] Calling RPC:', {
    function: 'get_shop_pending_campaigns',
    params: { p_shops_id: shopsID },
    timestamp: new Date().toISOString(),
  });

  const { data, error } = await supabase.rpc('get_shop_pending_campaigns', {
    p_shops_id: shopsID,
  });

  if (error) {
    console.error('[getShopPendingCampaigns] Error:', {
      function: 'get_shop_pending_campaigns',
      params: { p_shops_id: shopsID },
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to fetch pending campaigns: ${error.message}`);
  }

  return (data || []) as CampaignRow[];
}