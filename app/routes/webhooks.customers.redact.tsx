// app/routes/webhooks.customers.redact.tsx

import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import crypto from "crypto";
import createClient from "../../supabase/server";
import type { Database } from "../../supabase/database.types";

type Insert = Database["public"]["Tables"]["gdprrequests"]["Insert"];
const TOPIC = "customers/redact" as const;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const raw = await request.text();
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const digest = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64");
  if (!hmac || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac))) {
    return new Response("Invalid HMAC", { status: 401 });
  }

  const payload = JSON.parse(raw);
  const headerShopDomain = request.headers.get("x-shopify-shop-domain");

  const shop_domain: string | null = payload?.shop_domain ?? headerShopDomain ?? null;
  const shop_id: number | null = typeof payload?.shop_id === "number" ? payload.shop_id : null;
  const customer_email: string | null = payload?.customer?.email ?? null;
  const customerGID: string | null =
    payload?.customer?.id === undefined || payload?.customer?.id === null
      ? null
      : String(payload.customer.id);

  const supabase = createClient();

  // resolve shops.id
  let shops: number | null = null;
  if (shop_id !== null) {
    const { data } = await supabase.from("shops").select("id").eq("shop_id", shop_id).maybeSingle();
    if (data?.id) shops = data.id as number;
  }
  if (shops === null && shop_domain) {
    const { data } = await supabase.from("shops").select("id").eq("shopDomain", shop_domain).maybeSingle();
    if (data?.id) shops = data.id as number;
  }

  // resolve consumers.id
  let consumers: string | null = null;
  if (customerGID) {
    const { data } = await supabase.from("consumers").select("id").eq("customerGID", customerGID).maybeSingle();
    if (data?.id) consumers = data.id as string;
  }
  if (consumers === null && customer_email) {
    const { data } = await supabase.from("consumers").select("id").eq("email", customer_email).maybeSingle();
    if (data?.id) consumers = data.id as string;
  }

  const row: Insert = {
    topic: TOPIC,
    shops,
    consumers,
    shop_domain,
    shop_id,
    customer_email,
    customerGID,
    received_at: new Date().toISOString(),
    payload,
  };

  const { data, error } = await supabase.from("gdprrequests").insert(row).select("id").single();
  if (error) {
    console.error("gdprrequests insert failed (customers/redact):", error);
    return new Response("DB insert failed", { status: 500 });
  }

  return json({ ok: true, id: data.id });
};

