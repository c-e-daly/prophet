// app/routes/auth._index.tsx - OAuth initiation
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import crypto from "crypto";

// Validate shop domain
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("=== AUTH INITIATION ===");
  
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    console.log("No shop parameter, redirecting to home");
    return redirect("/");
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    console.error("Invalid shop domain:", shop);
    throw new Response("Invalid shop domain", { status: 400 });
  }

  console.log("Starting OAuth for shop:", shop);

  // OAuth configuration
  const CLIENT_ID = process.env.SHOPIFY_API_KEY as string;
  const SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products";
  // Updated to use your Remix app callback
  const CALLBACK_URL = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  
  if (!CLIENT_ID) {
    throw new Error("SHOPIFY_API_KEY not configured");
  }

  console.log("OAuth Config:");
  console.log("- CLIENT_ID:", CLIENT_ID);
  console.log("- SCOPES:", SCOPES);
  console.log("- CALLBACK_URL:", CALLBACK_URL);

  // Generate secure state parameter (should be stored and verified later)
  const state = crypto.randomBytes(32).toString('hex');
  console.log("Generated state:", state);

  // TODO: Store state in session/database for verification in callback

  // Build OAuth URL
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `redirect_uri=${encodeURIComponent(CALLBACK_URL)}&` +
    `state=${state}`;

  console.log("Redirecting to OAuth URL:", authUrl);
  
  return redirect(authUrl);
};