// app/lib/webhooks/gdpr-shared.ts
import crypto from "crypto";
import createClient from "../../../supabase/server";

export function verifyShopifyHmac(rawBody: string, secret: string, headerHmac: string | null) {
  if (!headerHmac) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(headerHmac));
}

export function buildGdprRow(topic: string, payload: any) {
  return {
    request_type: topic,                           // 'customers/data_request' | 'customers/redact' | 'shop/redact'
    shop_id: payload?.shop_id ?? null,             // numeric shop id (if present)
    shop_domain: payload?.shop_domain ?? null,     // 'foo.myshopify.com'
    customer_email: payload?.customer?.email ?? null,
    customergid: payload?.customer?.id ? String(payload.customer.id) : null,
    received_at: new Date().toISOString(),
    payload,                                       // full body for downstream funcs
  };
}

export async function insertGdprRequest(row: any) {
  const supabase = createClient(); // should use service role on server
  return supabase.from("gdprrequests").insert(row).select("id").single();
}
