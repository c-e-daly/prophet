// app/lib/queries/supabase/getShopCampaigns.ts
import createClient from '../../../../supabase/server';
import type { CampaignRow, ProgramRow } from '../../types/dbTables';

export type CampaignWithPrograms = CampaignRow & {
  programs: ProgramRow[];
};

export async function getShopCampaigns(
  shopId: number
): Promise<CampaignWithPrograms[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_campaigns', {
    p_shops_id: shopId,
  });

  if (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  // RPC returns SETOF jsonb - data is an array of campaign objects
  return (data as CampaignWithPrograms[]) || [];
}