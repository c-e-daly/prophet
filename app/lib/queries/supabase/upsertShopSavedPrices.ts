// app/lib/queries/supabase/variantPricing.ts
import createClient from "../../../../supabase/server";
import type { Database } from "../../../../supabase/database.types";

type VariantPricingInsert = Database["public"]["Tables"]["variantPricing"]["Insert"];
type VariantsUpdate = Database["public"]["Tables"]["variants"]["Update"];

export type SavePricingInput = {
  shopsID: number;
  variantId: number;        // local variants PK (numeric)
  variantGID: string;       // Shopify GID
  variantID: string;        // Shopify numeric (string) if you keep it
  productID: string;        // Shopify numeric (string)
  itemCost: number;         // cents
  profitMarkup: number;     // cents
  allowanceDiscounts: number; // cents
  allowanceShrink: number;  // cents
  allowanceFinance: number; // cents
  allowanceShipping: number;// cents
  marketAdjustment: number; // cents
  builderPrice: number;     // cents
  notes: string;
  userId: number;           // Shopify user ID (integer)
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
      createdByUser: input.userId, // keep if this column exists
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
 * Replaces the old RPC with direct updates:
 *  - variantPricing: isPublished=true, publishedDate=now(), publishedPrice, createdByUserID=userId
 *  - variants: shopifyPrice=publishedPrice for the given variantId
 *
 * NOTE: These two statements are not atomic without a SQL function/transaction.
 */
export async function markPricingPublished(input: {
  shopsID: number;
  pricingId: number;
  publishedPrice: number;  // cents
  userId: number;          // Shopify user ID (integer)
  variantId: number;       // local variants PK
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    // 1) Update variantPricing
    const { error: pricingError } = await supabase
      .from("variantPricing")
      .update({
        isPublished: true,
        publishedDate: now,
        publishedPrice: input.publishedPrice,
        createdByUserID: input.userId,   // per your request
        modifiedDate: now,
      } as Partial<Database["public"]["Tables"]["variantPricing"]["Update"]>)
      .eq("id", input.pricingId)
      .eq("shops", input.shopsID);

    if (pricingError) {
      throw new Error(`Failed to update variantPricing: ${pricingError.message}`);
    }

    // 2) Update variants shopifyPrice
    const { error: variantError } = await supabase
      .from("variants")
      .update({
        shopifyPrice: input.publishedPrice,
        modifiedDate: now,
      } as VariantsUpdate)
      .eq("id", input.variantId)
      .eq("shops", input.shopsID);

    if (variantError) {
      throw new Error(`Failed to update variant: ${variantError.message}`);
    }

    console.log("✅ Marked pricing as published:", {
      pricingId: input.pricingId,
      variantId: input.variantId,
      publishedPrice: input.publishedPrice,
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ markPricingPublished exception:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Publish pricing to Shopify and mark as published in database
 */
export async function publishAndMarkPricing(
  request: Request,
  input: SavePricingInput
): Promise<SavePricingResult> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    // Step 1: Save pricing (as "published" source, not yet isPublished)
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
      isPublished: false, // set true after Shopify confirms
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

    const { error: variantFKError } = await supabase
      .from("variants")
      .update(variantUpdate)
      .eq("id", input.variantId)
      .eq("shops", input.shopsID);

    if (variantFKError) {
      console.error("❌ Failed to set variant.pricing FK:", variantFKError);
      return { success: false, error: variantFKError.message };
    }

    console.log("✅ Saved pricing record:", newPricing.id);

    // Step 2: Publish to Shopify
    const { publishVariantPriceToShopify } = await import("../shopify/publishVariantPrice");
    const shopifyResult = await publishVariantPriceToShopify(request, {
      variantGID: input.variantGID,
      price: input.builderPrice / 100, // cents → dollars
    });

    if (!shopifyResult.success) {
      console.error("❌ Shopify publish failed:", shopifyResult.error);
      return {
        success: false,
        error: `Saved to database but Shopify rejected: ${shopifyResult.error}`,
        pricingId: newPricing.id,
      };
    }

    console.log("✅ Published to Shopify");

    // Step 3: Mark as published (direct updates, no RPC)
    const markResult = await markPricingPublished({
      shopsID: input.shopsID,
      pricingId: newPricing.id,
      publishedPrice: input.builderPrice,
      userId: input.userId,
      variantId: input.variantId,
    });

    if (!markResult.success) {
      console.error("❌ Failed to mark as published:", markResult.error);
      return {
        success: false,
        error: `Published to Shopify but database update failed: ${markResult.error}`,
        pricingId: newPricing.id,
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
    results.push(await savePricingDraft(input));
  }
  return { success: results.every(r => r.success), results };
}
