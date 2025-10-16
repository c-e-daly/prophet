// app/lib/webhooks/upsertShopifyCheckoutWebhook.ts
import createClient from '../../../supabase/server'

type Args = { shopDomain: string; topic: string, shopsID: number; payload: any};
const supabase = createClient();

export async function upsertShopifyCheckoutWebhook({ shopDomain, shopsID, payload, topic }: Args) {

  const { data: id, error } = await supabase.rpc("ingest_shopify_checkout", {
    _shops_id: shopsID,
    _shop_domain: shopDomain,
    _payload: payload, 
  });

   await supabase.rpc("log_webhook_event", {
   _shops_id: shopsID,
   _shop_domain: shopDomain,
   _topic: topic,
   _resource_id: payload.id?.toString() ?? null,
   _payload: payload,
 });

  
if (error) {
  console.error('RPC log_webhook_event error:', error);
  console.error('Error details:', JSON.stringify(error, null, 2));
  // Don't throw - logging failure shouldn't kill the webhook
}
  return id; // shopifyCheckoutId
}
