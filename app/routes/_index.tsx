// app/routes/_index.tsx - Entry point that determines where to send users
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
  const host = url.searchParams.get("host");
  const error = url.searchParams.get("error");
  const installed = url.searchParams.get("installed"); // Check if just completed OAuth
  
  console.log("Extracted params:", { shop, host, error, installed });

  // Handle OAuth errors
  if (error) {
    console.log("OAuth error received:", error);
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

  // If still no shop, show shop collection page
  if (!shop) {
    console.log("No shop parameter - showing shop collection page");
    return null; // Render the React component to collect shop info
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    console.error("Invalid shop domain:", shop);
    throw new Response("Invalid shop domain", { status: 400 });
  }

  // Check authentication status
  console.log("Checking authentication for shop:", shop);
  const supabase = createClient();
  
  const { data: shopAuth, error: authError } = await supabase
    .from("shopAuth")
    .select("access_token, shop_name")
    .eq("id", shop)
    .single();

  console.log("Auth status:", { 
    hasAuth: !!shopAuth, 
    hasToken: !!shopAuth?.access_token,
    justInstalled: !!installed
  });

  // If authenticated OR just completed installation, go to main app
  if (shopAuth?.access_token || installed) {
    console.log("Shop is authenticated - redirecting to main app");
    if (host) {
      return redirect(`/app?shop=${shop}&host=${encodeURIComponent(host)}`);
    } else {
      return redirect(`/app?shop=${shop}`);
    }
  }

  // Not authenticated - start OAuth flow
  console.log("Shop not authenticated - starting OAuth flow");
  return redirect(`/auth?shop=${shop}`);
}

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Prophet Analytics</h1>
        <p className="text-gray-600 text-center mb-8">
          Prophet is built by retailers for retailers to help you identify and understand
          consumer buying behaviors and forecast future profits.
        </p>
        
        <form method="get" action="/">
          <div className="mb-4">
            <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your shop domain:
            </label>
            <input
              type="text"
              id="shop"
              name="shop"
              placeholder="your-shop.myshopify.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Install Prophet
          </button>
        </form>
      </div>
    </div>
  );
}