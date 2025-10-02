// app/lib/queries/supabase/getShopProductVariants.ts
import createClient from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

export type VariantRow = Tables<"variants">;
export type VariantPricingRow = Tables<"variantPricing">;

export type VariantWithPricing = VariantRow & {
  variantPricing: VariantPricingRow | null; // from variants.pricing -> variantPricing.id
};

export type GetShopVariantsOptions = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeCreatedAt?: string;
  beforeId?: string | number;
};

export async function getShopProductVariants(
  shopsID: number,
  opts: GetShopVariantsOptions = {}
): Promise<{ variants: VariantWithPricing[]; count: number }> {
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

  // Join via the FK column: variants.pricing -> variantPricing.id
  let query = supabase
    .from("variants")
    .select(
      `
      *,
      variantPricing:pricing (*)
    `,
      { count: "exact" }
    )
    .eq("shops", shopsID)
    .gte("createDate", sinceISO)
    .order("createDate", { ascending: false })
    .order("id", { ascending: false });

  // Keyset or offset pagination
  if (beforeCreatedAt) {
    query = query.lt("createDate", beforeCreatedAt as string);
    if (beforeId !== undefined && beforeId !== null) {
      query = query.lt("id", beforeId as number);
    }
  } else {
    const from = Math.max(0, (page - 1) * limit);
    const to = from + Math.max(1, limit) - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getShopProductVariants failed: ${error.message}`);
  }

  // No transform needed: variantPricing is already a single nested row
  const variants = (data ?? []) as unknown as VariantWithPricing[];

  return {
    variants,
    count: count ?? 0,
  };
}
