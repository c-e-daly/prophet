// app/routes/webhooks.checkouts-update.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { upsertShopifyCheckoutWebhook } from "../lib/webhooks/upsertShopifyCheckoutWebhook";
import { getShopsID } from "../lib/queries/supabase/getShopsID";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log(`Webhook received - Topic: ${topic}, Shop: ${shop}`);
    
    // Check for BOTH formats because Shopify is inconsistent
    if (topic !== "CHECKOUTS_UPDATE" && topic !== "checkouts/update") {
      console.error(`Wrong topic received. Expected: CHECKOUTS_UPDATE or checkouts/update, Got: ${topic}`);
      return new Response(`Wrong topic: ${topic}`, { status: 400 });
    }
   
    const shopsID = await getShopsID(shop);
    
    if (!shopsID) {
      console.error(`Shop not found for domain: ${shop}`);
      return new Response("Shop not found", { status: 404 });
    }

    await upsertShopifyCheckoutWebhook({ 
      shopDomain: shop, 
      topic, 
      shopsID, 
      payload,
    });
    
    console.log(`Successfully processed checkout webhook for shop ${shop}`);
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
};