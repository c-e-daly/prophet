// lib/queries/carts.ts
import { createClient } from "../../utils/supabase/server";

export type CartRow = {
  id: string | number;
  cart_create_date: string | null;
  cart_item_count: number | null;
  cart_total_price: number | null;   // cents
  cart_status: string | null;
};

type GetCartsOpts = {
  page?: number;           // 1-based
  limit?: number;          // e.g., 50
  sinceMonths?: number;    // default 6, pass 0/undefined to disable
  status?: string | null;  // optional filter
  orderAsc?: boolean;      // default false
};

export async function getCartsByShop(shop: string, opts: GetCartsOpts = {}) {
  const supabase = createClient();
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const sinceMonths = opts.sinceMonths ?? 6;
  const orderAsc = opts.orderAsc ?? false;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("carts")
    .select(
      "id, cart_create_date, cart_item_count, cart_total_price, cart_status",
      { count: "exact" }
    )
    .eq("shop", shop)
    .order("cart_create_date", { ascending: orderAsc })
    .range(from, to);

  if (sinceMonths > 0) {
    // cart_create_date is timestamptz/string; compare with ISO cutoff
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - sinceMonths);
    q = q.gte("cart_create_date", cutoff.toISOString());
  }

  if (opts.status) {
    q = q.eq("cart_status", opts.status);
  }

  const { data, error, count } = await q;
  return {
    data: (data ?? []) as CartRow[],
    count: count ?? 0,
    error,
    page,
    limit,
    hasMore: (count ?? 0) > to + 1,
  };
}
