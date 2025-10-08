// app/lib/queries/supabase/getcarts.ts
// Generated: 2025-10-08T01:08:44.133Z
import createClient from '../../../../supabase/server';
import type { CartRow } from '../../types/dbTables';

export type GetCartParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetCartResult = {
  Cart: CartRow[];
  count: number;
};

export async function getShopcarts(
  shopId: number,
  params: GetCartParams = {}
): Promise<GetCartResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_carts', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching Cart:', error);
    throw new Error(`Failed to fetch Cart: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const Cart = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    Cart,
    count: result.total_count || 0,
  };
}
