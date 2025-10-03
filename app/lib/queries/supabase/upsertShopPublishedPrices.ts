// app/lib/queries/supabase/variantPricing.ts
import createClient from "../../../../supabase/server";

export type SavePricingInput = {
  shopsID: number;
  variantId: number;
  variantGID: string;
  variantID: string;
  productID: string;
  itemCost: number; // cents
  profitMarkup: number; // cents
  allowanceDiscounts: number; // cents
  allowanceShrink: number; // cents
  allowanceFinance: number; // cents
  allowanceShipping: number; // cents
  marketAdjustment: number; // cents
  builderPrice: number; // cents
  notes: string;
  userId: number; // Shopify user ID (integer)
  userEmail: string;
};

export type SavePricingResult = {
  success: boolean;
  pricingId?: number;
  error?: string;
};

/**
 * Save pricing as DRAFT - does not publish to Shopify
 * Creates new variantPricing record and updates variant.pricing FK
 */
export async function savePricingDraft(
  input: SavePricingInput
): Promise<SavePricingResult> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    // Insert new pricing record
    const { data: newPricing, error: insertError } = await supabase
      .from("variantPricing")
      .insert({
        shops: input.shopsID,
        variants: input.variantId,
        productID: input.productID,
        variantID: input.variantID,
        itemCost: input.itemCost,
        profitMarkup: input.profitMarkup,
        allowanceDiscounts: input.allowanceDiscounts,
        allowanceShrink: input.allowanceShrink,
        allowanceFinance: input.allowanceFinance,
        allowanceShipping: input.allowanceShipping,
        marketAdjustment: input.marketAdjustment,
        builderPrice: input.builderPrice,
        currency: "USD",
        source: "draft",
        notes: input.notes,
        createdByUser: input.userId,
        createDate: now,
        modifiedDate: now,
        updatedBy: input.userEmail,
        isPublished: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Failed to insert pricing:", insertError);
      return { success: false, error: insertError.message };
    }

    // Update variant.pricing FK
    const { error: updateError } = await supabase
      .from("variants")
      .update({ pricing: newPricing.id, modifiedDate: now })
      .eq("id", input.variantId)
      .eq("shops", input.shopsID);

    if (updateError) {
      console.error("❌ Failed to update variant:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log("✅ Saved pricing draft:", newPricing.id);
    return { success: true, pricingId: newPricing.id };

  } catch (error: any) {
    console.error("❌ savePricingDraft exception:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Mark pricing as published in database after Shopify confirms
 * Uses RPC function to update both variantPricing and variants atomically
 */
export async function markPricingPublished(input: {
  shopsID: number;
  pricingId: number;
  publishedPrice: number; // cents
  userId: string; // UUID from auth
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("publish_variant_pricing", {
      p_shops: input.shopsID,
      p_pricing_id: input.pricingId,
      p_published_price: input.publishedPrice,
      p_user: input.userId, // UUID
      p_published_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ publish_variant_pricing RPC failed:", {
        code: error.code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      return { success: false, error: error.message };
    }

    // RPC returns row with pricing_id, variant_id, pricing_updated, variant_updated
    console.log("✅ Marked pricing as published:", {
      pricingId: data?.[0]?.pricing_id,
      variantId: data?.[0]?.variant_id,
      pricingUpdated: data?.[0]?.pricing_updated,
      variantUpdated: data?.[0]?.variant_updated,
    });

    return { success: true };

  } catch (error: any) {
    console.error("❌ markPricingPublished exception:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Complete publish workflow: save + publish to Shopify + mark published
 * Returns pricingId for use in publish step
 */
export async function saveForPublish(
  input: SavePricingInput
): Promise<SavePricingResult> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    // Insert pricing record with source="published" but isPublished=false
    // We'll flip isPublished=true only after Shopify confirms
    const { data: newPricing, error: insertError } = await supabase
      .from("variantPricing")
      .insert({
        shops: input.shopsID,
        variants: input.variantId,
        productID: input.productID,
        variantID: input.variantID,
        itemCost: input.itemCost,
        profitMarkup: input.profitMarkup,
        allowanceDiscounts: input.allowanceDiscounts,
        allowanceShrink: input.allowanceShrink,
        allowanceFinance: input.allowanceFinance,
        allowanceShipping: input.allowanceShipping,
        marketAdjustment: input.marketAdjustment,
        builderPrice: input.builderPrice,
        currency: "USD",
        source: "published",
        notes: input.notes,
        createdByUser: input.userId,
        createDate: now,
        modifiedDate: now,
        updatedBy: input.userEmail,
        isPublished: false, // Will be set true after Shopify confirms
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Failed to insert pricing for publish:", insertError);
      return { success: false, error: insertError.message };
    }

    // Update variant.pricing FK
    const { error: updateError } = await supabase
      .from("variants")
      .update({ pricing: newPricing.id, modifiedDate: now })
      .eq("id", input.variantId)
      .eq("shops", input.shopsID);

    if (updateError) {
      console.error("❌ Failed to update variant for publish:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log("✅ Saved pricing for publish (pre-Shopify):", newPricing.id);
    return { success: true, pricingId: newPricing.id };

  } catch (error: any) {
    console.error("❌ saveForPublish exception:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Batch save multiple pricing records
 */
export async function batchSavePricingDrafts(
  inputs: SavePricingInput[]
): Promise<{ success: boolean; results: SavePricingResult[] }> {
  const results: SavePricingResult[] = [];

  for (const input of inputs) {
    const result = await savePricingDraft(input);
    results.push(result);
  }

  const allSucceeded = results.every(r => r.success);
  return { success: allSucceeded, results };
}

/*
// app/lib/queries/supabase/updateAfterPublish.ts
import createClient from "../../../../supabase/server";

type UpdateAfterPublishInput = {
  shopsID: number;
  variantId: number;
  pricingId: number;
  publishedPrice: number; // cents
  userId: number;
  userName?: string;
};

export async function updateAfterSuccessfulPublish(
  input: UpdateAfterPublishInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("publish_variant_pricing", {
    p_shops: input.shopsID,
    p_pricing_id: input.pricingId,
    p_published_price: input.publishedPrice,  // cents
    p_user: input.userId,
    p_published_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ publish_variant_pricing failed", {
      code: (error as any).code,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    return { success: false, error: error.message || "RPC failed" };
  }

  // Optional: sanity log
  console.info("✅ publish_variant_pricing ok", data);
  return { success: true };
}

export async function batchUpdateAfterPublish(
  shopsID: number,
  updates: Array<{
    variantId: number;
    pricingId: number;
    publishedPrice: number;
  }>,
  userId: number
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const update of updates) {
    const result = await updateAfterSuccessfulPublish({
      shopsID,
      variantId: update.variantId,
      pricingId: update.pricingId,
      publishedPrice: update.publishedPrice,
      userId,
    });

    if (!result.success) {
      errors.push(`Variant ${update.variantId}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

export async function handleVariantUpdateWebhook(payload: {
  id: number; // Shopify variant ID
  price: string; // e.g., "99.99"
  admin_graphql_api_id: string; // e.g., "gid://shopify/ProductVariant/123"
}): Promise<void> {
  const supabase = createClient();
  const priceInCents = Math.round(parseFloat(payload.price) * 100);
  const now = new Date().toISOString();

  // Find variant by GID
  const { data: variant } = await supabase
    .from("variants")
    .select("id, shops, shopifyPrice")
    .eq("variantGID", payload.admin_graphql_api_id)
    .maybeSingle();

  if (!variant) {
    console.warn(`Variant not found for GID: ${payload.admin_graphql_api_id}`);
    return;
  }

  // Only update if price actually changed
  if (variant.shopifyPrice === priceInCents) {
    return;
  }

  // Update variant with new Shopify price
  await supabase
    .from("variants")
    .update({
      shopifyPrice: priceInCents,
      modifiedDate: now,
    })
    .eq("id", variant.id);

  console.log(`Updated variant ${variant.id} shopifyPrice to ${priceInCents} cents via webhook`);
}
  */