import { serve } from "https://deno.land/std/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const params = url.searchParams;

  const hmac = params.get("hmac");
  const host = params.get("host");
  const session = params.get("session");
  const shop = params.get("shop");
  const timestamp = params.get("timestamp");

  console.log("Received parameters:", { hmac, host, session, shop, timestamp });

  if (!shop) return new Response("Missing shop parameter", { status: 400 });
  if (!hmac) return new Response("Missing HMAC", { status: 400 });

  try {
    // 🔐 HMAC Verification
    const secret = Deno.env.get("SHOPIFY_CLIENT_SECRET_DEV");
    if (secret) {
      const queryString = url.search.substring(1);
      const queryWithoutHmac = queryString
        .split("&")
        .filter((param) => !param.startsWith("hmac="))
        .sort()
        .join("&");

      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(queryWithoutHmac);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
      const calculatedHmac = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (calculatedHmac !== hmac) {
        console.error("HMAC mismatch:", calculatedHmac, "vs", hmac);
        return new Response("Invalid HMAC", { status: 401 });
      }

      console.log("✅ HMAC verification passed");
    } else {
      console.warn("No SHOPIFY_CLIENT_SECRET_DEV set — skipping HMAC verification");
    }

    // 🕒 Timestamp check
    if (timestamp) {
      const now = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp, 10);
      if (now - requestTime > 300) {
        return new Response("Request too old", { status: 401 });
      }
    }

    // 🔎 Check/create shop record
    const { data: existingShop } = await supabase
      .from("shops")
      .select("id")
      .eq("store_url", shop)
      .single();

    let shopId = existingShop?.id;
    if (!shopId) {
      const { data: newShop, error } = await supabase
        .from("shops")
        .insert([{ store_url: shop }])
        .select("id")
        .single();

      if (error || !newShop) {
        console.error("DB error:", error);
        return new Response("Database error", { status: 500 });
      }

      shopId = newShop.id;
    }

    // 🔄 Redirect to app dashboard
    const appUrl = Deno.env.get("SHOPIFY_APP_URL") || "https://prophet-beta.vercel.app";
    let decodedHost = host;

    try {
      decodedHost = host ? atob(host) : host;
    } catch {
      // If not base64, just use as-is
    }

    const redirectUrl = `${appUrl}/dashboard?shop=${shop}`;
    console.log("Redirecting to:", redirectUrl);

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "X-Frame-Options": "ALLOWALL",
        "Content-Security-Policy": "frame-ancestors *",
      },
    });
  } catch (err) {
    console.error("Authentication error:", err.message);
    return new Response(`Authentication failed: ${err.message}`, { status: 401 });
  }
});
