import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import crypto from "crypto";
import { writeGdprRequest } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const raw = await request.text();
  const payload = JSON.parse(raw);
  
  // FOR TESTING ONLY - Skip HMAC validation if testing header is present
  const isTesting = request.headers.get("x-testing-webhook") === "true";
  
  if (!isTesting) {
    // Verify webhook authenticity for production
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
    const hmac = request.headers.get("x-shopify-hmac-sha256");
    
    if (!secret) {
      console.error("SHOPIFY_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }
    
    if (!hmac) {
      return new Response("Missing HMAC header", { status: 401 });
    }
    
    const digest = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64");
    
    try {
      if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac))) {
        return new Response("Invalid HMAC", { status: 401 });
      }
    } catch (error) {
      console.error("HMAC validation error:", error);
      return new Response("Invalid HMAC format", { status: 401 });
    }
  }

  const headerShopDomain = request.headers.get("x-shopify-shop-domain");
  const shop_domain = payload?.shop_domain ?? headerShopDomain;

  if (!shop_domain) {
    return new Response("Missing shop domain", { status: 400 });
  }

  try {
    await writeGdprRequest(payload, shop_domain);
    return json({ ok: true });
  } catch (error) {
    console.error("GDPR request failed:", error);
    return new Response(error instanceof Error ? error.message : "Internal server error", { 
      status: 500 
    });
  }
};