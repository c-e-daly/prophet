import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
serve(async (req)=>{
  const url = new URL(req.url);
  const params = url.searchParams;
  // Get the parameters that Shopify is actually sending
  const hmac = params.get("hmac");
  const host = params.get("host");
  const session = params.get("session");
  const shop = params.get("shop");
  const timestamp = params.get("timestamp");
  console.log("Received parameters:", {
    hmac,
    host,
    session,
    shop,
    timestamp
  });
  if (!shop) {
    return new Response("Missing shop parameter", {
      status: 400
    });
  }
  if (!hmac) {
    return new Response("Missing HMAC", {
      status: 400
    });
  }
  try {
    // Verify HMAC (important for security)
    const secret = Deno.env.get("SHOPIFY_CLIENT_SECRET_DEV");
    console.log("Secret available:", !!secret);
    if (secret) {
      const queryString = url.search.substring(1); // Remove the '?'
      const queryWithoutHmac = queryString.split('&').filter((param)=>!param.startsWith('hmac=')).sort().join('&');
      console.log("Query without HMAC:", queryWithoutHmac);
      console.log("Expected HMAC:", hmac);
      // Use Web Crypto API for HMAC
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(queryWithoutHmac);
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, {
        name: 'HMAC',
        hash: 'SHA-256'
      }, false, [
        'sign'
      ]);
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const calculatedHmac = Array.from(new Uint8Array(signature)).map((b)=>b.toString(16).padStart(2, '0')).join('');
      console.log("Calculated HMAC:", calculatedHmac);
      if (calculatedHmac !== hmac) {
        console.error("HMAC verification failed - calculated vs expected:", calculatedHmac, "vs", hmac);
        return new Response("Invalid HMAC", {
          status: 401
        });
      }
      console.log("HMAC verification passed");
    } else {
      console.log("No secret found - skipping HMAC verification");
    }
    // Check timestamp (prevent replay attacks)
    if (timestamp) {
      const now = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp);
      if (now - requestTime > 300) {
        return new Response("Request too old", {
          status: 401
        });
      }
    }
  //FIND CREATE SHOP IN SUPABASE
    const { data: existingShop } = await supabase.from("shops").select("id").eq("store_url", shop).single();
    let shopId = existingShop?.id;
    if (!shopId) {
      const { data: newShop, error } = await supabase.from("shops").insert([
        {
          store_url: shop
        }
      ]).select("id").single();
      if (error || !newShop) {
        console.error("Database error:", error);
        return new Response("Database error", {
          status: 500
        });
      }
      shopId = newShop.id;
    }
    const appUrl = Deno.env.get("SHOPIFY_APP_URL");
    // Decode the host parameter if it's base64 encoded
    let decodedHost = host;
    if (host) {
      try {
        decodedHost = atob(host);
      } catch  {
        // If it's not base64, use as-is
        decodedHost = host;
      }
    }
    console.log("Redirecting to:", `${appUrl}/dashboard?shop=${shop}`);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/dashboard?shop=${shop}`,
        // Important: Allow embedding
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': 'frame-ancestors *'
      }
    });
  } catch (err) {
    console.error("Authentication error:", err.message);
    return new Response(`Authentication failed: ${err.message}`, {
      status: 401
    });
  }
});
