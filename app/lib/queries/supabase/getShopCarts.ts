// app/lib/queries/supabase/getShopCarts.ts
import createClient from '../../../../supabase/server';
import type { CartRow } from '../../types/dbTables';

export type GetCartParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  statuses?: string[];
};

export type GetCartResult = {
  carts: CartRow[];
  count: number;
};

export async function getShopCarts(
  shopId: number,
  params: GetCartParams = {}
): Promise<GetCartResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 100,
    page = 1,
    statuses = ['Offered', 'Abandoned'],
  } = params;

  const { data, error } = await supabase.rpc('get_shop_carts', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_statuses: statuses,
  });

  if (error) {
    console.error('Error fetching carts:', error);
    throw new Error(`Failed to fetch carts: ${error.message}`);
  }

  const result = (data as { carts: CartRow[]; count: number } | null) || { carts: [], count: 0 };
  
  return {
    carts: result.carts || [],
    count: result.count || 0,
  };

}