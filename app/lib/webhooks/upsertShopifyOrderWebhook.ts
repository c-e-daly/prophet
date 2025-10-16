// app/lib/webhooks/upsertShopifyOrderWebhook.ts
import createClient from "../../../supabase/server";
const supabase = createClient();

type Args = { topic: string; shopDomain: string; shopsID: number; payload: any };

export async function upsertShopifyOrderWebhook({ topic, shopDomain, shopsID, payload }: Args) {
  // 1) Upsert header (idempotent)
  const { data: orderId, error: hdrErr } = await supabase.rpc("ingest_shopify_order", {
    _shops_id: shopsID,
    _payload: payload,
  });
  if (hdrErr) throw hdrErr;

  // 2) Upsert details (safe to run on all order topics; it replaces lines atomically)
  const { error: detErr } = await supabase.rpc("upsert_shopify_order_details", {
    _shops_id: shopsID,
    _order_id: orderId,
    _payload: payload,
  });
  if (detErr) throw detErr;

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
  return orderId;
}
