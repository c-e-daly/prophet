// app/routes/auth.$.tsx - Shopify OAuth handler + Supabase record creation

import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";
import { createClient } from "../utils/supabase/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("=== AUTH CALLBACK START ===");
  
  try {
    // Let Shopify handle the OAuth flow
    const { session } = await authenticate.admin(request);
    
    console.log("OAuth successful, session:", {
      shop: session.shop,
      accessToken: session.accessToken ? "exists" : "missing"
    });

    // Now create/update records in Supabase
    const supabase = createClient();
    
    // First, upsert the shop record
    console.log("Upserting shop record for:", session.shop);
    const { data: shopRecord, error: shopError } = await supabase
      .from("shops")
      .upsert({
        store_url: session.shop,
        // Add any other shop fields you need
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'store_url'
      })
      .select("id")
      .single();

    if (shopError) {
      console.error("Shop upsert error:", shopError);
      throw new Error(`Failed to create shop record: ${shopError.message}`);
    }

    console.log("Shop record created/updated:", shopRecord);
    const shopId = shopRecord.id;

    // Then, upsert the shopAuth record
    console.log("Upserting shopAuth record for shop ID:", shopId);
    const { error: authError } = await supabase
      .from("shopAuths")
      .upsert({
        shop_id: shopId,
        access_token: session.accessToken,
        scope: session.scope || "",
        // Add any other auth fields you need
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shop_id'
      });

    if (authError) {
      console.error("ShopAuth upsert error:", authError);
      throw new Error(`Failed to create shopAuth record: ${authError.message}`);
    }

    console.log("ShopAuth record created/updated successfully");
    console.log("=== AUTH CALLBACK COMPLETE ===");

    // Redirect to the app with shop parameter
    return redirect(`/app?shop=${session.shop}`);

  } catch (error) {
    console.error("Auth callback error:", error);
    
    // If OAuth fails, redirect back to index to try again
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    return redirect(shop ? `/?shop=${shop}` : "/");
  }
};