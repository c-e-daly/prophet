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

/**
 * Update database after successful Shopify price publish
 * Only call this AFTER Shopify confirms the price was updated
 */
export async function updateAfterSuccessfulPublish(
  input: UpdateAfterPublishInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    // Update variantPricing with publish confirmation
    const { error: pricingError } = await supabase
      .from("variantPricing")
      .update({
        isPublished: true,
        publishedPrice: input.publishedPrice,
        publishedDate: now,
        approvedByUser: input.userId,
        modifiedDate: now,
      })
      .eq("id", input.pricingId)
      .eq("shops", input.shopsID);

    if (pricingError) {
      return { success: false, error: `Failed to update pricing: ${pricingError.message}` };
    }

    // Update variant with new Shopify price
    const { error: variantError } = await supabase
      .from("variants")
      .update({
        shopifyPrice: input.publishedPrice,
        modifiedDate: now,
      })
      .eq("id", input.variantId)
      .eq("shops", input.shopsID);

    if (variantError) {
      return { success: false, error: `Failed to update variant: ${variantError.message}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error updating database" };
  }
}

/**
 * Batch update multiple variants after bulk publish
 */
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

/**
 * Webhook handler for Shopify product variant update
 * Call this when Shopify sends a webhook that a variant price changed
 */
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