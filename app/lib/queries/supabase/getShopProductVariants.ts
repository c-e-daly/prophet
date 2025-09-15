// app/lib/queries/getShopCarts.ts
import  createClient  from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

export type VariantRow = Tables<"variants">;
export type GetShopVariantsOptions = {
  monthsBack?: number;
  limit?: number;
  page?: number;                // offset pagination (used when no keyset args)
  beforeCreatedAt?: string;     // ISO string for keyset pagination
  beforeId?: string | number;   // with beforeCreatedAt
};

export async function getShopProductVariants(
  shopId: number,
  opts: GetShopVariantsOptions = {}
): Promise<{ variants: VariantRow[]; count: number }> {
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

  let query = supabase
    .from("variants")
    .select("*", { count: "exact" })
    .eq("shops", shopId)
    .gte("createDate", sinceISO);


  // Stable ordering for pagination
  query = query
    .order("createDate", { ascending: false })
    .order("id", { ascending: false });

  // Keyset pagination (optional)
  if (beforeCreatedAt) {
    query = query.lt("createDate", beforeCreatedAt);
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
  console.log("[getShopProductVariants]", {
    shopId,
    monthsBack,
    sinceISO,
    limit,
    page,
    beforeCreatedAt,
    beforeId,
  });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getShopProductVariants failed: ${error.message}`);
  }

  return {
    variants: (data ?? []) as VariantRow[],
    count: count ?? 0,
  };
}
