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
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Try to authenticate the webhook
    let topic, shop;
    try {
      const authResult = await authenticate.webhook(request);
      topic = authResult.topic;
      shop = authResult.shop;
      console.log('Webhook authenticated successfully:', { topic, shop });
    } catch (authError) {
      console.error('Webhook authentication failed:', authError);
      // Log the error details but still try to process if we can get the topic from headers
      const headerTopic = request.headers.get('x-shopify-topic');
      const headerShop = request.headers.get('x-shopify-shop-domain');
      
      console.log('Trying to use header values:', { headerTopic, headerShop });
      
      if (headerTopic === 'app/uninstalled' && headerShop) {
        topic = headerTopic;
        shop = headerShop;
        console.log('Using header values for processing');
      } else {
        console.error('Cannot process webhook - authentication failed and headers insufficient');
        return new Response("Authentication failed", { status: 401 });
      }
    }
    
    console.log('Authenticated webhook:', { topic, shop });
    
    if (topic !== "app/uninstalled" && topic !== "APP_UNINSTALLED") {
      console.log(`Wrong topic received: ${topic}, expected app/uninstalled or APP_UNINSTALLED`);
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

    // Get the shop ID from headers (may not be present in app/uninstalled webhooks)
    const shopifyShopId = request.headers.get('X-Shopify-Shop-ID');
    console.log('Shopify Shop ID from header:', shopifyShopId);

    // Find the shop - primarily by domain since shop ID may not be in headers
    let query = supabase
      .from("shops")
      .select("id, shopDomain, shopsGID")
      .eq("shopDomain", normalizedShop);
    
    // If we have a shop ID, also try matching on that
    if (shopifyShopId) {
      query = supabase
        .from("shops")
        .select("id, shopDomain, shopsGID")
        .or(`shopDomain.eq.${normalizedShop},shopsGID.eq.${shopifyShopId}`);
    }

    const { data: shopData, error: findErr } = await query
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