// app/lib/queries/getShopCarts.ts
import { createClient } from "../../utils/supabase/server";

export type CartRow = { [key: string]: any };

export type GetShopCartsOptions = {

  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeCreatedAt?: string;
  beforeId?: string | number;
};

export async function getShopCarts(
  shopId: number,
  opts: GetShopCartsOptions = {}
): Promise<{ carts: CartRow[]; count: number }> {
  const supabase = createClient();

  const {
    monthsBack = 12,
    limit = 100,
    page = 1,
    beforeCreatedAt,
    beforeId,
  } = opts;

  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceISO = since.toISOString();

  // Base query
  let query = supabase
    .from("carts")
    .select("*", { count: "exact" })
    .eq("shop", shopId)
    .eq("cartStatus", "OFFERED")
    .gte("cartCreateDate", sinceISO);

  // Ordering for stable pagination (created_date desc, id desc)
  query = query.order("cartCreatDate", { ascending: false }).order("id", { ascending: false });

  // Optional keyset pagination (preferred for big tables)
  if (beforeCreatedAt) {
    query = query.lt("cartCreateaDate", beforeCreatedAt);
    if (beforeId !== undefined && beforeId !== null) {
      // Additional tie-breaker if needed; if your DB supports composite comparison you can skip this
      query = query.lt("id", beforeId);
    }
  } else {
    // Fallback to simple page/range pagination
    const from = (page - 1) * limit;
    const to = from + (limit - 1);
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    // Surface a clear error for the route loader to handle/log
    throw new Error(`getShopCarts failed: ${error.message}`);
  }

  return {
    carts: data ?? [],
    count: count ?? 0,
  };
}
