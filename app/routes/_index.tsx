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
    .select("access_token, shop_name")
    .eq("id", shop)
    .single();

  console.log("Auth query details:", {
    queryingFor: shop,
    hasAuth: !!shopauth,
    hasToken: !!shopauth?.access_token,
    authError: authError,
    shopAuthData: shopauth ? { hasToken: !!shopauth.access_token, shopName: shopauth.shop_name } : null,
    justInstalled: !!installed
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