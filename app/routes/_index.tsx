import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "../utils/supabase/server";

type LoaderData = {
  authenticated: boolean;
  shop: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== LOADER START ===");
  console.log("Request URL:", request.url);
  
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  console.log("Initial shop param:", shop);

  // If no shop param, try to extract from host (embedded apps)
  if (!shop) {
    const host = url.searchParams.get("host");
    console.log("Host param:", host);
    if (host) {
      // Decode base64 host and extract shop
      try {
        const decodedHost = atob(host);
        console.log("Decoded host:", decodedHost);
        const match = decodedHost.match(/store\/([^\/]+)/);
        if (match) {
          shop = `${match[1]}.myshopify.com`;
          console.log("Extracted shop:", shop);
        } else {
          console.log("No match found in decoded host");
        }
      } catch (e) {
        console.error("Failed to decode host:", e);
      }
    }
  }

  if (!shop) {
    console.log("No shop found, redirecting to /auth/login");
    return redirect("/auth/login");
  }

  console.log("Final shop value:", shop);

  // Test Supabase client
  console.log("Creating Supabase client...");
  const supabase = createClient();
  console.log("Supabase client created:", !!supabase);

  // Get shop ID from the `shops` table
  console.log("Querying shops table for:", shop);
  const { data: shopRecord, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", shop)
    .single();

  console.log("Shop query result:", { shopRecord, shopError });
  const shopId = shopRecord?.id;
  console.log("Shop ID:", shopId);

  if (shopId) {
    console.log("Checking shopAuths for shop ID:", shopId);
    const { data: shopAuth, error: authError } = await supabase
      .from("shopAuths")
      .select("access_token")
      .eq("shop_id", shopId)
      .single();

    console.log("Auth query result:", { shopAuth, authError });

    if (shopAuth?.access_token) {
      console.log("Found access token, redirecting to app");
      return redirect(`/app?shop=${shop}`);
    }
  }

  // Not authenticated - start OAuth flow
  console.log("=== STARTING OAUTH FLOW ===");
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID_DEV;
  const SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products";
  const CALLBACK_URL = process.env.SHOPIFY_CALLBACK_URL;

  console.log("OAuth Config:");
  console.log("- CLIENT_ID:", CLIENT_ID);
  console.log("- SCOPES:", SCOPES);
  console.log("- CALLBACK_URL:", CALLBACK_URL);

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `scope=${SCOPES}&` +
    `redirect_uri=${CALLBACK_URL}&` +
    `state=${crypto.randomUUID()}`;

  console.log("Final OAuth URL:", authUrl);
  console.log("=== REDIRECTING TO OAUTH ===");

  return redirect(authUrl);
}

export default function Index() {
  // This should never render due to redirects
  return <div>Initializing PROPHET...</div>;
}