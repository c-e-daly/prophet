// app/routes/webhooks.customers.redact.tsx

import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import crypto from "crypto";
import { writeGdprRedactRequest } from "../lib/webhooks/write";

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

  const payload = JSON.parse(raw);
  const headerShopDomain = request.headers.get("x-shopify-shop-domain");
  const shop_domain = payload?.shop_domain ?? headerShopDomain;

  if (!shop_domain) {
    return new Response("Missing shop domain", { status: 400 });
  }

  try {
    await writeGdprRedactRequest(payload, shop_domain);
    return json({ ok: true });
  } catch (error) {
    console.error("GDPR redact request failed:", error);
    return new Response(error instanceof Error ? error.message : "Internal server error", { 
      status: 500 
    });
  }
};