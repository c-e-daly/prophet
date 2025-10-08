// app/lib/queries/supabase/getcampaigns.ts
// Generated: 2025-10-08T01:07:19.343Z
import createClient from '../../../../supabase/server';
import type { CampaignRow } from '../../types/dbTables';

export type GetCampaignParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetCampaignResult = {
  Campaign: CampaignRow[];
  count: number;
};

export async function getShopcampaigns(
  shopId: number,
  params: GetCampaignParams = {}
): Promise<GetCampaignResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_campaigns', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching Campaign:', error);
    throw new Error(`Failed to fetch Campaign: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const Campaign = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    Campaign,
    count: result.total_count || 0,
  };
}
