// app/lib/queries/supabase/getcart_items.ts
// Generated: 2025-10-08T01:11:18.401Z
import createClient from '../../../../supabase/server';
import type { CartItemRow } from '../../types/dbTables';

export type GetCartItemParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetCartItemResult = {
  CartItem: CartItemRow[];
  count: number;
};

export async function getShopcartItems(
  shopId: number,
  params: GetCartItemParams = {}
): Promise<GetCartItemResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_cart_items', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching CartItem:', error);
    throw new Error(`Failed to fetch CartItem: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const CartItem = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    CartItem,
    count: result.total_count || 0,
  };
}
