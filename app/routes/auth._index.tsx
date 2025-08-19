// app/routes/auth._index.tsx - Initiates OAuth flow
import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server"; // Updated import path

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== AUTH._INDEX START ===");
  console.log("Auth request URL:", request.url);
  
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  console.log("Auth params:", { shop });
  
  if (!shop) {
    console.error("No shop parameter in auth route");
    throw new Response("Missing shop parameter", { status: 400 });
  }
  
  try {
    // This will automatically handle the OAuth flow
    // If not authenticated, redirects to Shopify OAuth
    // If authenticated, redirects back to app
    console.log("Starting Shopify authentication for:", shop);
    const result = await authenticate.admin(request);
    
    // This shouldn't be reached in normal flow
    console.log("Authentication completed successfully");
    return null;
    
  } catch (error) {
    // Check if this is a redirect response (which is normal for OAuth)
    if (error instanceof Response && error.status === 302) {
      console.log("OAuth redirect detected, following redirect to:", error.headers.get('location'));
      // Let the redirect happen naturally
      throw error; // This will cause the redirect to be followed
    }
    
    console.error("Unexpected authentication error:", error);
    throw error;
  }
}

// This should not render in normal flow
export default function AuthIndex() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fef3c7', 
      border: '2px solid orange',
      fontFamily: 'monospace',
      textAlign: 'center'
    }}>
      <h1>🔄 Starting OAuth Flow...</h1>
      <p>Please wait while we redirect you to Shopify for authentication.</p>
      <p>If you see this message for more than a few seconds, please refresh the page.</p>
    </div>
  );
}

/*
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
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID as string;
  const SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products";
  // Updated to use your Remix app callback
  const CALLBACK_URL = `${process.env.SHOPIFY_APP_URL}/auth/callback`;

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
*/