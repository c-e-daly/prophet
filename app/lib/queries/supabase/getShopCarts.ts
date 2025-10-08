// app/lib/queries/supabase/getShopCarts.ts
import createClient from '../../../../supabase/server';
import { CartStatusEnum, type CartRow, type CartStatusType} from '../../types/dbTables';

export type GetCartParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  statuses?: CartStatusType[];
};

export type GetCartResult = {
  carts: CartRow[];
  count: number;
};

type RpcRow = {
  rows: unknown;        // comes back as Json
  total_count: number;
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
    statuses = [
      CartStatusEnum.Offered, 
      CartStatusEnum.Abandoned
    ] as CartStatusType[],
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


  const payload = (Array.isArray(data) ? data[0] : data) as RpcRow | null;

  const carts = (payload?.rows as CartRow[]) ?? [];
  const count = payload?.total_count ?? 0;

  return { carts, count };
}
