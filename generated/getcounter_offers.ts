// app/lib/queries/supabase/getcounter_offers.ts
// Generated: 2025-10-08T01:10:16.130Z
import createClient from '../../../../supabase/server';
import type { CounterOfferRow } from '../../types/dbTables';

export type GetCounterOfferParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetCounterOfferResult = {
  CounterOffer: CounterOfferRow[];
  count: number;
};

export async function getShopcounterOffers(
  shopId: number,
  params: GetCounterOfferParams = {}
): Promise<GetCounterOfferResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_counter_offers', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching CounterOffer:', error);
    throw new Error(`Failed to fetch CounterOffer: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const CounterOffer = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    CounterOffer,
    count: result.total_count || 0,
  };
}
