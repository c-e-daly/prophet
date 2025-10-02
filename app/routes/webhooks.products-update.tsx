// app/routes/webhooks.products-update.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";

/**
 * Webhook handler for PRODUCTS_UPDATE from Shopify
 * This fires when product/variant details change, including price updates
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (!admin || !session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Get shop ID
    const { data: shopData } = await supabase
      .from("shops")
      .select("id")
      .eq("shopDomain", shop)
      .maybeSingle();

    if (!shopData) {
      console.warn(`Shop not found: ${shop}`);
      return new Response("OK", { status: 200 }); // Still return 200 to acknowledge webhook
    }

    // Process each variant in the product
    for (const variant of payload.variants || []) {
      const variantGID = variant.admin_graphql_api_id;
      const shopifyPrice = Math.round(parseFloat(variant.price) * 100); // Convert to cents

      // Find variant in our database
      const { data: existingVariant } = await supabase
        .from("variants")
        .select("id, shopifyPrice")
        .eq("variantGID", variantGID)
        .eq("shops", shopData.id)
        .maybeSingle();

      if (!existingVariant) {
        console.log(`Variant not found in DB: ${variantGID}`);
        continue;
      }

      // Only update if price actually changed
      if (existingVariant.shopifyPrice !== shopifyPrice) {
        await supabase
          .from("variants")
          .update({
            shopifyPrice,
            modifiedDate: now,
          })
          .eq("id", existingVariant.id);

        console.log(`Updated variant ${existingVariant.id} price: ${existingVariant.shopifyPrice} → ${shopifyPrice}`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Error", { status: 500 });
  }
};