
// app/routes/_index.tsx - Root route that handles initial app loading
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";

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
async function storeShopData(session: any) {
  try {
    const { createClient } = await import("../utils/supabase/server");
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

/*
// app/routes/_index.tsx - Invisible router that determines where to send users
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createClient } from "../utils/supabase/server";

// Validate shop domain
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== INDEX ROUTER START ===");
  console.log("Request URL:", request.url);
  
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");
  const error = url.searchParams.get("error");
  const installed = url.searchParams.get("installed"); // Check if just completed OAuth
  
  console.log("Extracted params:", { shop, host, error, installed });

  // Handle OAuth errors
  if (error) {
    console.log("OAuth error received:", error);
    // Redirect to error page instead of showing error in index
    return redirect(`/error?type=${error}`);
  }

  // If no shop param, try to extract from host (embedded apps)
  if (!shop && host) {
    try {
      const decodedHost = atob(host);
      console.log("Decoded host:", decodedHost);
      const storeMatch = decodedHost.match(/store\/([^\/]+)/) || decodedHost.match(/([^\/]+)\/admin/);
      if (storeMatch) {
        shop = `${storeMatch[1]}.myshopify.com`;
        console.log("Extracted shop from host:", shop);
      }
    } catch (e) {
      console.error("Failed to decode host:", e);
    }
  }

  // If still no shop, redirect to shop collection page
  if (!shop) {
    console.log("No shop parameter - redirecting to install page");
    return redirect("/");
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    console.error("Invalid shop domain:", shop);
    return redirect("/error?type=invalid_shop");
  }

  // Check authentication status
  console.log("Checking authentication for shop:", shop);
  const supabase = createClient();
  
  const { data: shopauth, error: authError } = await supabase
    .from("shopauth")
    .select("access_token, shop_name, shop_id")
    .eq("id", shop)
    .single();

  console.log("Auth query details:", {
    queryingFor: shop,
    hasAuth: !!shopauth,
    hasToken: !!shopauth?.access_token,
    authError: authError,
    shopAuthData: shopauth ? { hasToken: !!shopauth.access_token, shopName: shopauth.shop_name } : null,
    justInstalled: !!installed,
    shopid: !!shopauth?.shop_id
  });

  // If authenticated OR just completed installation, go to main app
  if (shopauth?.access_token || installed) {
    console.log("Shop is authenticated - redirecting to main app");
    const appUrl = `/app?shop=${shop}${host ? `&host=${encodeURIComponent(host)}` : ''}`;
    console.log("Redirecting to:", appUrl);
    return redirect(appUrl);
  }

  // Not authenticated - start OAuth flow
  console.log("Shop not authenticated - starting OAuth flow");
  return redirect(`/auth?shop=${shop}`);
}

// This component should NEVER render - it's just a router
export default function Index() {
  // If this renders, something went wrong
  return (
    <div style={{ padding: '20px', backgroundColor: '#fee', border: '2px solid red' }}>
      <h1>ERROR: Index route rendered - this should not happen!</h1>
      <p>This route should only redirect, never show content.</p>
    </div>
  );
}
  */