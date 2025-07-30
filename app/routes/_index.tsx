// app/routes/_index.tsx - HMAC verification + Supabase check + OAuth redirect

import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "../utils/supabase/server";
import crypto from "crypto";

// Verify HMAC signature from Shopify
function verifyHmac(query: URLSearchParams, secret: string): boolean {
  const hmac = query.get('hmac');
  if (!hmac) return false;

  // Remove hmac from query params for verification
  const params = new URLSearchParams(query);
  params.delete('hmac');
  params.delete('signature'); // Also remove signature if present

  // Sort parameters and create query string
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Generate HMAC
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(calculatedHmac, 'hex')
  );
}

// Validate shop domain
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== INDEX LOADER START ===");
  console.log("Request URL:", request.url);
  
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  console.log("Initial shop param:", shop);

  // HMAC verification if we have query parameters
  const hasQueryParams = url.search.length > 0;
  if (hasQueryParams) {
    const secret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!secret) {
      throw new Error("SHOPIFY_CLIENT_SECRET not configured");
    }

    const isValidHmac = verifyHmac(url.searchParams, secret);
    console.log("HMAC verification:", isValidHmac);
    
    if (!isValidHmac) {
      console.error("Invalid HMAC signature");
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  // If no shop param, try to extract from host (embedded apps)
  if (!shop) {
    const host = url.searchParams.get("host");
    console.log("Host param:", host);
    if (host) {
      try {
        const decodedHost = atob(host);
        console.log("Decoded host:", decodedHost);
        const match = decodedHost.match(/store\/([^\/]+)/);
        if (match) {
          shop = `${match[1]}.myshopify.com`;
          console.log("Extracted shop:", shop);
        }
      } catch (e) {
        console.error("Failed to decode host:", e);
      }
    }
  }

  if (!shop) {
    console.log("No shop found, need to get shop parameter");
    return redirect("/auth/login"); // or wherever you collect shop info
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    console.error("Invalid shop domain:", shop);
    throw new Response("Invalid shop domain", { status: 400 });
  }

  console.log("Final shop value:", shop);

  // Check if shop exists and is authenticated in Supabase
  console.log("Creating Supabase client...");
  const supabase = createClient();
  
  console.log("Querying shops table for:", shop);
  const { data: shopRecord, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", shop)
    .single();

  console.log("Shop query result:", { shopRecord, shopError });
  const shopId = shopRecord?.id;

  if (shopId) {
    console.log("Checking shopAuths for shop ID:", shopId);
    const { data: shopAuth, error: authError } = await supabase
      .from("shopAuths")
      .select("access_token")
      .eq("shop_id", shopId)
      .single();

    console.log("Auth query result:", { shopAuth, authError });

    if (shopAuth?.access_token) {
      console.log("Found valid access token, redirecting to app");
      return redirect(`/app?shop=${shop}`);
    }
  }

  // Not authenticated - redirect to Shopify's OAuth system
  console.log("=== REDIRECTING TO SHOPIFY OAUTH ===");
  return redirect(`/auth?shop=${shop}`);
}

export default function Index() {
  // This should never render due to redirects
  return <div>Initializing PROPHET...</div>;
}