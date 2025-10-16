// app/lib/webhooks/upsertShopifyCheckoutWebhook.ts
import createClient from '../../../supabase/server'

type Args = { shopDomain: string; topic: string; shopsID: number; payload: any };
const supabase = createClient();

export async function upsertShopifyCheckoutWebhook({ shopDomain, shopsID, payload, topic }: Args) {
  // 1) Validate BEFORE calling RPC
  if (!Number.isFinite(shopsID)) {
    console.error('ingest_shopify_checkout: shopsID is invalid:', shopsID);
    throw new Error('shopsID is required and must be a finite number');
  }
  if (!shopDomain || typeof shopDomain !== 'string') {
    console.error('ingest_shopify_checkout: shopDomain is invalid:', shopDomain);
    throw new Error('shopDomain is required');
  }
  if (!payload || typeof payload !== 'object') {
    console.error('ingest_shopify_checkout: payload is invalid type:', typeof payload);
    throw new Error('payload must be an object');
  }

  console.log('Calling ingest_shopify_checkout with:', {
    shopsID,
    shopDomain,
    payloadId: payload?.id ?? null,
    payloadSize: (() => { try { return JSON.stringify(payload).length } catch { return -1 } })(),
  });

  // 2) Call the main RPC and log errors explicitly
  const { data: id, error: ingestError } = await supabase.rpc('ingest_shopify_checkout', {
    _shops_id: shopsID,
    _shop_domain: shopDomain,
    _payload: payload,
  });

  if (ingestError) {
    console.error('RPC ingest_shopify_checkout failed:', {
      message: ingestError.message,
      details: ingestError.details,
      hint: ingestError.hint,
      code: ingestError.code,
    });
    throw ingestError;
  }
  console.log('ingest_shopify_checkout returned id:', id);

  // 3) Log webhook event (separate try/catch is okay)
  try {
    console.log('Attempting log_webhook_event with:', {
      shopsID,
      shopDomain,
      topic,
      resourceId: payload?.id?.toString() ?? null,
    });

    const { data, error: logErr } = await supabase.rpc('log_webhook_event', {
      _shops_id: shopsID,
      _shop_domain: shopDomain,
      _topic: topic,
      _resource_id: payload?.id?.toString() ?? null,
      _payload: payload,
    });

    if (logErr) {
      console.error('RPC log_webhook_event failed:', {
        message: logErr.message,
        details: logErr.details,
        hint: logErr.hint,
        code: logErr.code,
      });
    } else {
      console.log('Webhook logged, ID:', data);
    }
  } catch (err) {
    console.error('Exception calling log_webhook_event:', err);
  }

  return id; // shopifyCheckoutId (text)
}
