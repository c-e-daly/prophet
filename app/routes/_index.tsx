// app/routes/_index.tsx - Fixed version without unnecessary HMAC verification

import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "../utils/supabase/server";

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

  // Check for error parameter from OAuth callback
  const error = url.searchParams.get("error");
  if (error) {
    console.log("OAuth error received:", error);
    // Handle different error types
    switch (error) {
      case "oauth_denied":
        return new Response("App installation was denied", { status: 403 });
      case "missing_params":
        return new Response("Missing required parameters", { status: 400 });
      case "invalid_shop":
        return new Response("Invalid shop domain", { status: 400 });
      case "invalid_signature":
        return new Response("Invalid signature", { status: 401 });
      case "oauth_failed":
        return new Response("OAuth failed", { status: 500 });
      default:
        return new Response("Unknown error", { status: 500 });
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
        // Handle both possible host formats
        const storeMatch = decodedHost.match(/store\/([^\/]+)/) || decodedHost.match(/([^\/]+)\/admin/);
        if (storeMatch) {
          shop = `${storeMatch[1]}.myshopify.com`;
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
  
  // First, check if we have auth credentials for this shop
  console.log("Querying shopAuth table for:", shop);
  const { data: shopAuth, error: authError } = await supabase
    .from("shopAuth")
    .select("access_token, shop_id, shop_name")
    .eq("id", shop) // id field in shopAuth is the shop domain
    .single();

  console.log("Auth query result:", { 
    hasAuth: !!shopAuth, 
    hasToken: !!shopAuth?.access_token,
    error: authError 
  });

  if (shopAuth?.access_token) {
    console.log("Found valid access token, shop is authenticated");
    // Shop is authenticated, redirect to main app
    return redirect(`/app?shop=${shop}&host=${url.searchParams.get("host") || ""}`);
  }

  // Not authenticated - redirect to Shopify's OAuth system
  console.log("=== REDIRECTING TO SHOPIFY OAUTH ===");
  return redirect(`/auth?shop=${shop}`);
}

export default function Index() {
  // This should never render due to redirects
  return <div>Initializing PROPHET...</div>;
}