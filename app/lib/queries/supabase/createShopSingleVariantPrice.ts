// app/lib/queries/supabase/upsertShopSingleVariantPrice.ts
import createClient from "../../../utils/supabase/server";
import type { Inserts, Tables } from "../../types/dbTables";

type VariantPricing = Tables<"variantPricing">;

export type UpdateVariantPricingPayload = {
  variants: number;                 // variants.id (FK)
  shops: number;                   // shops.id (FK)
  profitMarkup?: number | null;
  allowanceShrink?: number | null;
  allowanceShipping?: number | null;
  allowanceFinance?: number | null;
  allowanceDiscounts?: number | null;
  marketAdjustment?: number | null;
  effectivePrice: number | null;   // required for any row
  published?: boolean | null;      // when true => additional requirements
  publishedPrice?: number | null;  // required when published = true
  publishedDate?: string | null;   // required when published = true (auto-filled if missing)
  createDate?: string | null;
  modifiedDate?: string | null;
  createdBy?: string | null;
};

export async function upsertShopSingleVariantPrice(payload: UpdateVariantPricingPayload) {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // Basic guards
  if (!payload.variants) throw new Error("Missing variant id");
  if (!payload.shops) throw new Error("Missing shop id");
  if (payload.effectivePrice == null) throw new Error("Effective Price is required");
  if (payload.allowanceDiscounts == null) throw new Error("Discount Allowance is required");

  const publishing = payload.published === true;

  // Publishing-specific guards
  if (publishing) {
    if (payload.publishedPrice == null) {
      throw new Error("published = true requires publishedPrice");
    }
  }

  // If publishing a new price, unpublish any currently-published price for this variant first
  if (publishing) {
    const { error: unpubErr } = await supabase
      .from("variantPricing")
      .update({
        published: false,
        modifiedDate: nowIso,
      } as Partial<VariantPricing>)
      .eq("variant", payload.variants)
      .eq("published", true);

    if (unpubErr) throw new Error(`Failed to unpublish current price: ${unpubErr.message}`);
  }

  // Build the row to insert (keep history; do not upsert)
  const row: Inserts<"variantPricing"> = {
    variants: payload.variants,
    shops: payload.shops,
    profitMarkup: payload.profitMarkup ?? null,
    allowanceShrink: payload.allowanceShrink ?? null,
    allowanceShipping: payload.allowanceShipping ?? null,
    allowanceFinance: payload.allowanceFinance ?? null,
    allowanceDiscounts: payload.allowanceDiscounts ?? null,
    marketAdjustment: payload.marketAdjustment ?? null,
    effectivePrice: payload.effectivePrice,
    published: publishing,
    publishedPrice: publishing ? payload.publishedPrice! : null,
    publishedDate: publishing ? (payload.publishedDate ?? nowIso) : null,
    createDate: payload.createDate ?? nowIso,
    modifiedDate: payload.modifiedDate ?? nowIso,
    createdBy: payload.createdBy ?? "priceBuilder",
  };

  const { data, error } = await supabase
    .from("variantPricing")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(error.message || "variant pricing insert failed");
  return data?.id as number;
}
