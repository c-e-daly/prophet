// app/routes/_index.tsx - Root route that handles initial app loading
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import { authenticate } from "../utils/shopify/shopify.server"; // Updated import path
import { createClient } from "../utils/supabase/server"; // Static import

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== INDEX ROUTE START ===");
  console.log("Request URL:", request.url);
  
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");
  const embedded = url.searchParams.get("embedded");
  
  console.log("URL Params:", { shop, host, embedded });

  // If no shop parameter, redirect to install page or error
  if (!shop) {
    console.log("No shop parameter found");
    return redirect("/app");
  }

  // Validate shop domain format
  if (!isValidShopDomain(shop)) {
    console.error("Invalid shop domain:", shop);
    return redirect("/error?type=invalid_shop");
  }

  try {
    // Use Shopify's built-in authentication
    console.log("Attempting to authenticate with Shopify...");
    const { admin, session } = await authenticate.admin(request);
    
    console.log("Authentication successful:", {
      shop: session.shop,
      isOnline: session.isOnline,
      hasAccessToken: !!session.accessToken
    });

    // Store/update shop data in your Supabase after successful auth
    await storeShopData(session);
    
    // Redirect to main app with proper parameters
    const appUrl = `/app?shop=${encodeURIComponent(session.shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`;
    console.log("Redirecting to main app:", appUrl);
    return redirect(appUrl);
    
  } catch (error) {
    console.error("Authentication failed:", error);
    
    // If authentication fails, start the OAuth flow
    console.log("Starting OAuth flow for shop:", shop);
    return redirect(`/auth?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`);
  }
}

// Validate shop domain format
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

// Store shop data in Supabase after successful Shopify authentication
async function storeShopData(session: Session) {
  try {
    const supabase = createClient();
    
    console.log("Storing/updating shop data for:", session.shop);
    
    // Upsert shop data
    const { error } = await supabase
      .from('shops')
      .upsert({
        id: session.shop,
        storeurl: session.shop,
        shop_domain: session.shop,
        access_token: session.accessToken,
        shop_name: session.shop.replace('.myshopify.com', ''),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
      
    if (error) {
      console.error("Failed to store shop data:", error);
    } else {
      console.log("Shop data stored successfully");
    }
  } catch (error) {
    console.error("Error storing shop data:", error);
  }
}

// This component should NEVER render in production
export default function Index() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fee', 
      border: '2px solid red',
      fontFamily: 'monospace'
    }}>
      <h1>🚨 ERROR: Index route rendered</h1>
      <p>This route should only redirect, never show content.</p>
      <p>If you see this, there's an issue with your authentication flow.</p>
    </div>
  );
}