// app/lib/queries/supabase/counterOffers/getCounterOffers.ts

import createClient from '../../../../supabase/server';
import type { CounterOfferRow } from '../../types/dbTables';

export type GetCounterOfferParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  statuses?: string[];
};

export type GetCounterOfferResult = {
  counterOffers: CounterOfferRow[];
  count: number;
};

export async function getShopCounterOffers(
  shopId: number,
  params: GetCounterOfferParams = {}
): Promise<GetCounterOfferResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    statuses = [
      'Reviewed Countered',
      'Consumer Accepted',
      'Consumer Declined',
    ],
  } = params;

  const { data, error } = await supabase.rpc('get_shop_counter_offers', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_statuses: statuses,
  });

  if (error) {
    console.error('Error fetching counter offers:', error);
    throw new Error(`Failed to fetch counter offers: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const counterOffers = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    counterOffers,
    count: result.total_count || 0,
  };
}

