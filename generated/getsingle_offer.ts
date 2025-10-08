// app/lib/queries/supabase/getsingle_offer.ts
// Generated: 2025-10-08T01:10:57.912Z
import createClient from '../../../../supabase/server';
import type { OfferRow } from '../../types/dbTables';

export type GetOfferParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetOfferResult = {
  Offer: OfferRow[];
  count: number;
};

export async function getShopsingleOffer(
  shopId: number,
  params: GetOfferParams = {}
): Promise<GetOfferResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_single_offer', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching Offer:', error);
    throw new Error(`Failed to fetch Offer: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const Offer = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    Offer,
    count: result.total_count || 0,
  };
}
