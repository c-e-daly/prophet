import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import crypto from "crypto";
import createClient from "../../supabase/server";
import type { Database } from "../../supabase/database.types";

type Insert = Database["public"]["Tables"]["gdprrequests"]["Insert"];
const TOPIC = "customers/data_request" as const;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Verify webhook authenticity
  const raw = await request.text();
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const digest = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64");
  
  if (!hmac || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac))) {
    return new Response("Invalid HMAC", { status: 401 });
  }

  // Parse payload and extract data
  const payload = JSON.parse(raw);
  const headerShopDomain = request.headers.get("x-shopify-shop-domain");
  const shop_domain: string | null = payload?.shop_domain ?? headerShopDomain ?? null;
  const shop_id: number | null = typeof payload?.shop_id === "number" ? payload.shop_id : null;
  const customer_email: string | null = payload?.customer?.email ?? null;
  const customerGID: string = payload?.customer?.id;

  if (!customerGID) {
    return new Response("Missing customer ID", { status: 400 });
  }

  const supabase = createClient();

  try {
    // Find the shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .or(`shop_id.eq.${shop_id},shopDomain.eq.${shop_domain}`)
      .maybeSingle();

    if (shopError) {
      console.error("Shop lookup failed:", shopError);
      return new Response("Shop lookup failed", { status: 500 });
    }

    if (!shop) {
      console.error("Shop not found for shop_id:", shop_id, "shop_domain:", shop_domain);
      return new Response("Shop not found", { status: 404 });
    }

    // Find the consumer
    const { data: consumer, error: consumerError } = await supabase
      .from("consumers")
      .select("id")
      .eq("customerShopifyGID", customerGID)
      .maybeSingle();

    if (consumerError) {
      console.error("Consumer lookup failed:", consumerError);
      return new Response("Consumer lookup failed", { status: 500 });
    }

    if (!consumer) {
      console.error("Consumer not found for customerShopifyGID:", customerGID);
      return new Response("Consumer not found", { status: 404 });
    }

    // Insert GDPR request
    const row: Insert = {
      topic: TOPIC,
      shop_id: shop.id,
      consumer_id: consumer.id,
      shop_domain,
      customer_email,
      customerGID,
      received_at: new Date().toISOString(),
      payload,
    };

    const { data, error } = await supabase
      .from("gdprrequests")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("GDPR request insert failed:", error);
      return new Response("DB insert failed", { status: 500 });
    }

    return json({ ok: true, id: data.id });

  } catch (error) {
    console.error("Unexpected error in GDPR webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
};