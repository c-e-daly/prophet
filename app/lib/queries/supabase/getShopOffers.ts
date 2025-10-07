// app/lib/queries/supabase/getShopOffers.ts
import createClient from '../../../../supabase/server';
import type { OfferRow } from '../../types/dbTables';

export type GetShopOffersParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  statuses?: string[];
};

export type GetShopOffersResult = {
  offers: OfferRow[];
  count: number;
};

export async function getShopOffers(
  shopId: number,
  params: GetShopOffersParams = {}
): Promise<GetShopOffersResult> {
  const supabase = createClient(); // No request parameter needed
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    statuses = ['Offered', 'Abandoned'],
  } = params;

  const { data, error } = await supabase.rpc('get_shop_offers', {
    p_shops_id: shopId, // Note: plural 'shops_id'
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_statuses: statuses,
  });

  if (error) {
    console.error('Error fetching shop offers:', error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  // RPC returns array with single object containing rows and total_count
  const result = data?.[0] || { rows: [], total_count: 0 };
  
  // Parse the rows JSON if needed
  const offers = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    offers,
    count: result.total_count || 0,
  };
}