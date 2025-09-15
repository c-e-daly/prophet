// app/lib/queries/getShopCarts.ts
import  createClient  from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

export type CartRow = Tables<"carts">;

type CartStatus = CartRow extends { cart_status: infer S }
  ? (S extends string ? S : string)
  : string;

export type GetShopCartsOptions = {
  monthsBack?: number;
  limit?: number;
  page?: number;                // offset pagination (used when no keyset args)
  status?: CartStatus;          // single status (legacy)
  statuses?: CartStatus[];      // multiple statuses (preferred)
  beforeCreatedAt?: string;     // ISO string for keyset pagination
  beforeId?: string | number;   // with beforeCreatedAt
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
    status, // kept for backward-compat
    statuses = status ? [status] : (["Offered", "Abandoned"] as CartStatus[]),
    beforeCreatedAt,
    beforeId,
  } = opts;

  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceISO = since.toISOString();

  let query = supabase
    .from("carts")
    .select("*", { count: "exact" })
    .eq("shops", shopId)
    .gte("cartCreateDate", sinceISO);

  if (Array.isArray(statuses) && statuses.length > 0) {
    query = query.in("cartStatus", statuses as string[]);
  }

  // Stable ordering for pagination
  query = query
    .order("cartCreateDate", { ascending: false })
    .order("id", { ascending: false });

  // Keyset pagination (optional)
  if (beforeCreatedAt) {
    query = query.lt("cartCreateDate", beforeCreatedAt);
    if (beforeId !== undefined && beforeId !== null) {
      query = query.lt("id", beforeId as number);
    }
  } else {
    // Offset pagination
    const from = Math.max(0, (page - 1) * limit);
    const to = from + Math.max(1, limit) - 1;
    query = query.range(from, to);
  }

  // Debug (remove/quiet for prod)
  console.log("[getShopCarts]", {
    shopId,
    monthsBack,
    sinceISO,
    limit,
    page,
    statuses,
    beforeCreatedAt,
    beforeId,
  });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getShopCarts failed: ${error.message}`);
  }

  return {
    carts: (data ?? []) as CartRow[],
    count: count ?? 0,
  };
}
