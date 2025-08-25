// app/lib/queries/getShopCarts.ts
import { createClient } from "../../utils/supabase/server";
import type { Tables, Enum } from "./types/dbTables";

export type CartRow = Tables<"carts">;

type CartStatus =
  CartRow extends { cart_status: infer S } ? (S extends string ? S : string) : string;

export type GetShopCartsOptions = {
  monthsBack?: number;
  limit?: number;
  page?: number;                // used only if no keyset params
  status?: CartStatus;          // default 'offered' (match exact stored casing/value)
  beforeCreatedAt?: string;     // ISO string for keyset pagination
  beforeId?: string | number;   // works with beforeCreatedAt
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
    status = "Offered" as CartStatus, // ← set to the exact value used in your DB
    beforeCreatedAt,
    beforeId,
  } = opts;

  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceISO = since.toISOString();

  // Base query — snake_case columns from your schema
  let query = supabase
    .from("carts")
    // Use a typed select; "*" is fine when CartRow matches the table
    .select("*", { count: "exact" })
    .eq("shop", shopId)
    .eq("cart_status", status)
    .gte("cart_create_date", sinceISO);

  // Stable ordering for pagination: newest first, then id desc
  query = query
    .order("cart_create_date", { ascending: false })
    .order("id", { ascending: false });

  // Keyset pagination (preferred for large tables)
  if (beforeCreatedAt) {
    query = query.lt("cart_create_date", beforeCreatedAt);
    if (beforeId !== undefined && beforeId !== null) {
      query = query.lt("id", beforeId as number);
    }
  } else {
    // Fallback to offset pagination
    const from = Math.max(0, (page - 1) * limit);
    const to = from + Math.max(1, limit) - 1;
    query = query.range(from, to);
  }

  // Optional: server-side debug during bring‑up
  console.log("[getShopCarts]", {
    shopId, monthsBack, sinceISO, limit, page, status, beforeCreatedAt, beforeId,
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
