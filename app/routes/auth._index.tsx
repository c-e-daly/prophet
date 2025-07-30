// app/routes/auth._index.tsx - OAuth initiation with proper security

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
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
  const SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products";
  const CALLBACK_URL = "https://jqqmquuomykzdeplumki.supabase.co/functions/v1/oauth2callback";
  
  if (!CLIENT_ID) {
    throw new Error("SHOPIFY_CLIENT_ID not configured");
  }

  console.log("OAuth Config:");
  console.log("- CLIENT_ID:", CLIENT_ID);
  console.log("- SCOPES:", SCOPES);
  console.log("- CALLBACK_URL:", CALLBACK_URL);

  // Generate secure state parameter (should be stored and verified later)
  const state = crypto.randomBytes(32).toString('hex');
  console.log("Generated state:", state);

  // Build OAuth URL
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `redirect_uri=${encodeURIComponent(CALLBACK_URL)}&` +
    `state=${state}`;

  console.log("Redirecting to OAuth URL:", authUrl);
  
  return redirect(authUrl);
};