// app/routes/webhooks.app.uninstalled.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";

function normalizeShopDomain(shop: string) {
   return shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    console.log('=== Webhook received ===');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    
    let topic, shop;
    try {
      const authResult = await authenticate.webhook(request);
      topic = authResult.topic;
      shop = authResult.shop;
      console.log('Webhook authenticated successfully:', { topic, shop });
    } catch (authError) {
      console.error('Webhook authentication failed:', authError);
    
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
                    
    const shopifyShopId = request.headers.get('X-Shopify-Shop-ID');
    console.log('Shopify Shop ID from header:', shopifyShopId);

    // Find the shop - primarily by domain since shop ID may not be in headers
    let query = supabase
      .from("shops")
      .select("id, shopDomain, shopsGID")
      .eq("shopDomain", normalizedShop);
    
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
        uninstalledDate: new Date().toISOString(),
      })
      .eq("id", shopData.id);

    if (shopsErr) {
      console.error('Error updating shops table:', shopsErr);
      throw shopsErr;
    }

    console.log('Updated shop status successfully');

   
    const { error: authErr } = await supabase
      .from("shopauth")
      .update({
        accessToken: "",
        shopifyScope: "",
      })
      .eq("shops", shopData.id); 

    if (authErr) {
      console.error('Error updating shopauth table:', authErr);
      console.log('Continuing despite auth token clear failure');
    } else {
      console.log('Cleared auth tokens successfully');
    }

    console.log(`App uninstalled successfully for shop: ${normalizedShop}`);
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("App uninstall webhook error:", error);
    
  
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return new Response("Internal error", { status: 500 });
  }
}

export async function loader({}: LoaderFunctionArgs) {
  return new Response("Method Not Allowed", { status: 405 });
}