// app/routes/app.tsx - Main app layout
import { type LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { Session } from "@shopify/shopify-api";
import { authenticate } from "../utils/shopify/shopify.server"; // Updated import path
import { createClient } from "../utils/supabase/server"; // Static import

type LoaderData = {
  shop: string;
  isOnline: boolean;
};

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== APP LOADER START ===");
  console.log("App request URL:", request.url);
  
  try {
    // Use Shopify's authentication - this is the key fix
    const { admin, session } = await authenticate.admin(request);
    
    console.log("App authenticated successfully:", {
      shop: session.shop,
      isOnline: session.isOnline,
      hasAccessToken: !!session.accessToken
    });
    
    // Sync to Supabase after successful auth (optional)
    await syncShopToSupabase(session);
    
    return json<LoaderData>({
      shop: session.shop,
      isOnline: session.isOnline
    });
    
  } catch (error) {
    // Check if this is a redirect response (normal for OAuth)
    if (error instanceof Response && error.status === 302) {
      console.log("OAuth redirect needed, location:", error.headers.get('location'));
      // Let Shopify handle the redirect
      throw error;
    }
    
    console.error("App authentication failed:", error);
    
    // If authentication fails, redirect to auth flow
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const host = url.searchParams.get("host");
    
    if (shop) {
      const authUrl = `/auth?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`;
      console.log("Redirecting to auth:", authUrl);
      throw new Response(null, {
        status: 302,
        headers: { Location: authUrl }
      });
    } else {
      console.log("No shop parameter, redirecting to index");
      throw new Response(null, {
        status: 302,
        headers: { Location: "/" }
      });
    }
  }
}

async function syncShopToSupabase(session: Session) {
  try {
    const supabase = createClient();
    
    // Update last_accessed timestamp
    await supabase
      .from('shops')
      .upsert({
        id: session.shop,
        storeurl: session.shop,
        access_token: session.accessToken,
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
      
    console.log("Shop data synced to Supabase");
  } catch (error) {
    console.error("Failed to sync shop data:", error);
  }
}

export default function App() {
  const { shop, isOnline } = useLoaderData<typeof loader>();
  
  return (
    <div>
      {/* Your app layout/navigation here */}
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <small>Shop: {shop} | Online: {isOnline ? 'Yes' : 'No'}</small>
      </div>
      
      {/* This renders the nested routes */}
      <Outlet />
    </div>
  );
}

/*
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useSearchParams } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../utils/shopify/shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Ensures the request is an authenticated Admin session (redirects to auth if not)
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const withQS = (p: string) => (qs ? `${p}?${qs}` : p);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to={withQS("/app")} rel="home">Home</Link>
        <Link to={withQS("/app/dashboard")}>Dashboard</Link>
        <Link to={withQS("/app/portfolios")}>Portfolios</Link>
        <Link to={withQS("/app/offers")}>Customer Offers</Link>
        <Link to={withQS("/app/carts")}>Offered Carts</Link>
        <Link to={withQS("/app/campaigns")}>Campaigns</Link>
        <Link to={withQS("/app/results")}>Campaign Results</Link>
        <Link to={withQS("/app/templates")}>Templates</Link>
        <Link to={withQS("/app/subscription")}>Subscription</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}



Shopify needs Remix to catch thrown responses to include headers
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
*/