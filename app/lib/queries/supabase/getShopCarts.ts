// app/lib/queries/supabase/getShopCarts.ts
import createClient from '../../../../supabase/server';
import { CartStatusEnum, type CartRow, type CartStatusType} from '../../types/dbTables';

export type GetCartParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  statuses?: CartStatusType[];  // ADD THIS
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
  shopsID: number,
  opts: GetCartParams = {}
): Promise<{ carts: CartRow[]; count: number }> {
  const { 
    monthsBack = 12, 
    limit = 50, 
    page = 1,
    statuses  // ADD THIS
  } = opts;

 const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_carts', {
    p_shops_id: shopsID,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_statuses: statuses  // PASS THIS to RPC
  });
  

   if (error) {
   console.error('Error fetching offer details:', {
     message: error.message,
     code: error.code,
     details: error.details,
     hint: error.hint,
     fullError: error,
   });
 }

  const payload = (Array.isArray(data) ? data[0] : data) as RpcRow | null;

  const carts = (payload?.rows as CartRow[]) ?? [];
  const count = payload?.total_count ?? 0;

  return { carts, count };
}
