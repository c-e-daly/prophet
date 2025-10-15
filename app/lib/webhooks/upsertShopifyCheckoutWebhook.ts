// app/lib/webhooks/upsertShopifyCheckoutWebhook.ts
import createClient from '../../../supabase/server'

type Args = { shopDomain: string; shopsID: number; payload: any };
const supabase = createClient();

export async function upsertShopifyCheckoutWebhook({ shopDomain, shopsID, payload }: Args) {

  const { data: id, error } = await supabase.rpc("ingest_shopify_checkout", {
    _shops_id: shopsID,
    _shop_domain: shopDomain,
    _payload: payload, 
  });

  if (error) throw error;
  return id; // shopifyCheckoutId
}
