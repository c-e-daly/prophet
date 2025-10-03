// app/lib/queries/supabase/variantPricing.ts
import createClient from "../../../../supabase/server";
import type { Database } from "../../../../supabase/database.types";

type VariantPricingInsert = Database["public"]["Tables"]["variantPricing"]["Insert"];
type VariantsUpdate = Database["public"]["Tables"]["variants"]["Update"];

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
    // Build typed insert object
    const pricingInsert: VariantPricingInsert = {
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
    };

    const { data: newPricing, error: insertError } = await supabase
      .from("variantPricing")
      .insert(pricingInsert)
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Failed to insert pricing:", insertError);
      return { success: false, error: insertError.message };
    }

    // Build typed update object
    const variantUpdate: VariantsUpdate = {
      pricing: newPricing.id,
      modifiedDate: now,
    };

    const { error: updateError } = await supabase
      .from("variants")
      .update(variantUpdate)
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
  userId: number; // Shopify user ID (integer)
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("publish_variant_pricing", {
      p_shops: input.shopsID,
      p_pricing_id: input.pricingId,
      p_published_price: input.publishedPrice,
      p_user: input.userId, // Shopify user ID (integer)
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
 * Publish pricing to Shopify and mark as published in database
 * This is the complete publish workflow in one function
 */
export async function publishAndMarkPricing(
  request: Request,
  input: SavePricingInput
): Promise<SavePricingResult> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    // Step 1: Save pricing record (not yet published)
    const pricingInsert: VariantPricingInsert = {
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
    };

    const { data: newPricing, error: insertError } = await supabase
      .from("variantPricing")
      .insert(pricingInsert)
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Failed to insert pricing:", insertError);
      return { success: false, error: insertError.message };
    }

    // Update variant.pricing FK
    const variantUpdate: VariantsUpdate = {
      pricing: newPricing.id,
      modifiedDate: now,
    };

    await supabase
      .from("variants")
      .update(variantUpdate)
      .eq("id", input.variantId)
      .eq("shops", input.shopsID);

    console.log("✅ Saved pricing record:", newPricing.id);

    // Step 2: Publish to Shopify
    const { publishVariantPriceToShopify } = await import("../shopify/publishVariantPrice");
    
    const shopifyResult = await publishVariantPriceToShopify(request, {
      variantGID: input.variantGID,
      price: input.builderPrice / 100, // Convert cents to dollars
    });

    if (!shopifyResult.success) {
      console.error("❌ Shopify publish failed:", shopifyResult.error);
      return { 
        success: false, 
        error: `Saved to database but Shopify rejected: ${shopifyResult.error}`,
        pricingId: newPricing.id 
      };
    }

    console.log("✅ Published to Shopify");

    // Step 3: Mark as published via RPC
    const rpcResult = await markPricingPublished({
      shopsID: input.shopsID,
      pricingId: newPricing.id,
      publishedPrice: input.builderPrice,
      userId: input.userId,
    });

    if (!rpcResult.success) {
      console.error("❌ Failed to mark as published:", rpcResult.error);
      return {
        success: false,
        error: `Published to Shopify but database update failed: ${rpcResult.error}`,
        pricingId: newPricing.id
      };
    }

    console.log("✅ Complete publish workflow successful");
    return { success: true, pricingId: newPricing.id };

  } catch (error: any) {
    console.error("❌ publishAndMarkPricing exception:", error);
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