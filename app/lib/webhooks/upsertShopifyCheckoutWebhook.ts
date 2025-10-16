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

try {
  console.log('Attempting to log webhook event with params:', {
    shopsID,
    shopDomain,
    topic,
    resourceId: payload.id?.toString() ?? null,
    payloadSize: JSON.stringify(payload).length,
  });

  const { data, error } = await supabase.rpc("log_webhook_event", {
    _shops_id: shopsID,
    _shop_domain: shopDomain,
    _topic: topic,
    _resource_id: payload.id?.toString() ?? null,
    _payload: payload, // This might need to be stringified/parsed
  });

  if (error) {
    console.error('RPC log_webhook_event failed:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  } else {
    console.log('Webhook logged successfully, ID:', data);
  }
} catch (err) {
  console.error('Exception calling log_webhook_event:', err);
}

  return id; // shopifyCheckoutId
}
