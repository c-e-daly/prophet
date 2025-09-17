// app/routes/webhooks.app.uninstalled.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";

function normalizeShopDomain(shop: string) {
  // Your normalization logic
  return shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    console.log('=== Webhook received ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    const { topic, shop } = await authenticate.webhook(request);
    
    console.log('Authenticated webhook:', { topic, shop });
    
    if (topic !== "app/uninstalled") {
      console.log(`Wrong topic received: ${topic}`);
      return new Response("Wrong topic", { status: 400 });
    }

    const normalizedShop = normalizeShopDomain(shop);
    console.log('Shop domain normalization:', { original: shop, normalized: normalizedShop });

    const supabase = createClient();

    // First, let's see what shops exist in the database
    const { data: allShops } = await supabase
      .from("shops")
      .select("id, shopDomain")
      .limit(10);
    
    console.log('Sample shops in database:', allShops);

    // Get the shop ID from headers for more reliable lookup
    const shopifyShopId = request.headers.get('X-Shopify-Shop-ID');
    console.log('Shopify Shop ID from header:', shopifyShopId);

    // Find the shop using both domain and Shopify ID for better matching
    const { data: shopData, error: findErr } = await supabase
      .from("shops")
      .select("id, shopDomain, shopsGID")
      .or(`shopDomain.eq.${normalizedShop},shopsGID.eq.${shopifyShopId}`)
      .limit(1)
      .maybeSingle();

    console.log('Shop lookup result:', { shopData, findErr });

    if (findErr) {
      console.error('Database error finding shop:', findErr);
      throw findErr;
    }
    
    if (!shopData?.id) {
      console.error(`Shop not found for ${normalizedShop}`);
      // Return 200 to prevent Shopify retries for non-existent shops
      return new Response("Shop not found - webhook processed", { status: 200 });
    }

    console.log(`Found shop: ${shopData.id} for domain ${normalizedShop}`);

    // Update shop status
    const { error: shopsErr } = await supabase
      .from("shops")
      .update({
        isActive: false,
        uninstallDate: new Date().toISOString(),
      })
      .eq("id", shopData.id);

    if (shopsErr) {
      console.error('Error updating shops table:', shopsErr);
      throw shopsErr;
    }

    console.log('Updated shop status successfully');

    // Clear auth tokens - using the correct foreign key relationship
    const { error: authErr } = await supabase
      .from("shopauth")
      .update({
        accessToken: "",
        shopifyScope: "",
      })
      .eq("shops", shopData.id); // Assuming "shops" is your FK column name

    if (authErr) {
      console.error('Error updating shopauth table:', authErr);
      // Don't throw here - shop deactivation is more important than clearing tokens
      console.log('Continuing despite auth token clear failure');
    } else {
      console.log('Cleared auth tokens successfully');
    }

    console.log(`App uninstalled successfully for shop: ${normalizedShop}`);
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("App uninstall webhook error:", error);
    
    // Log the full error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Return 200 to prevent Shopify retries for permanent failures
    // Return 500 only for temporary issues that might resolve
    return new Response("Internal error", { status: 500 });
  }
}

export async function loader({}: LoaderFunctionArgs) {
  return new Response("Method Not Allowed", { status: 405 });
}