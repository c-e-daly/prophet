// app/routes/webhooks.orders-create.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { upsertShopifyOrderWebhook } from "../lib/webhooks/upsertShopifyOrderWebhook";
import { getShopsID } from "../lib/queries/supabase/getShopsID";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
    
  const { topic, shop, payload } = await authenticate.webhook(request);
  
  if (topic !== "ORDERS_CREATE") {
    return new Response("Wrong topic", { status: 400 });
  }
 
  const shopsID = await getShopsID(shop);
  
  if (!shopsID) {
    console.error(`Shop not found for domain: ${shop}`);
    return new Response("Shop not found", { status: 404 });
  }

  await upsertShopifyOrderWebhook({ 
    shopDomain: shop, 
    topic, 
    shopsID, // Now correctly typed as number
    payload,
  });
  
  return new Response("OK", { status: 200 });
};