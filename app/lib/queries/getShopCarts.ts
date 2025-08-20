// app/lib/queries/getShopCarts.ts
import { createClient } from "../../utils/supabase/server";

/**
 * Cart row type — uses an index signature because you said
 * "retrieve ALL cart columns". If you want stricter types, replace with your schema.
 */
export type CartRow = { [key: string]: any };

export type GetShopCartsOptions = {
  /** Months to look back; defaults to 12 */
  monthsBack?: number;
  /** Page size; defaults to 100 */
  limit?: number;
  /** 1-based page index; defaults to 1 */
  page?: number;
  /**
   * Optional keyset pagination if you prefer it:
   * fetch rows created before this ISO timestamp (paired with beforeId for tie‑break)
   */
  beforeCreatedAt?: string;
  /** Optional tie-breaker for keyset pagination */
  beforeId?: string | number;
};

/**
 * Fetch carts for a shop that are still OFFERED (i.e., abandoned offers),
 * from the last N months. Returns ALL columns.
 *
 * Assumptions:
 * - Table: `carts`
 * - Columns:
 *   - `shop` (FK to shops.id)
 *   - `status` (values include 'OFFERED', 'EXPIRED', 'CHECKOUT', 'CLOSED_LOST', 'CLOSED_WON')
 *   - `created_date` (timestamptz)
 * - RLS policies allow the current session to read `carts` for the given shop, or
 *   you're running this server-side with suitable service claims.
 */
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
    .eq("status", "OFFERED")
    .gte("created_date", sinceISO);

  // Ordering for stable pagination (created_date desc, id desc)
  query = query.order("created_date", { ascending: false }).order("id", { ascending: false });

  // Optional keyset pagination (preferred for big tables)
  if (beforeCreatedAt) {
    query = query.lt("created_date", beforeCreatedAt);
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

/**
 * Convenience helper if you're using your withShopLoader to derive shopId
 * inside route loaders. Adjust the import path to match your project.
 */
// import { withShopLoader } from "../loaders/withShopLoader";
// import type { LoaderFunctionArgs } from "@remix-run/node";

// export async function getShopCartsFromRequest(
//   request: LoaderFunctionArgs["request"],
//   opts?: GetShopCartsOptions
// ) {
//   const { shopId } = await withShopLoader(request);
//   return getShopCarts(shopId, opts);
// }
