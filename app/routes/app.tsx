// ===== 3. app/routes/app.tsx (LAYOUT WITH SESSION CONTEXT) =====
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { authenticate } from "../utils/shopify/shopify.server";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css";
import type { CompleteShopSession } from "../lib/types/shopSession";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];


export const ShopSessionContext = createContext<CompleteShopSession | null>(null);
export const useShopSession = () => {
  const context = useContext(ShopSessionContext);
  if (!context) {
    throw new Error("useShopSession must be used within ShopSessionProvider");
  }
  return context;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const { shopSession, headers } = await requireCompleteShopSession(request);
    
    return json({
      shop: session.shop,
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      shopSession,
    }, { headers });
    
  } catch (error) {
    console.error("App layout auth failed:", error);
    
    // Extract shop from URL if available
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const host = url.searchParams.get("host");
    
    if (shop) {
      // Redirect to auth with both shop and host
      const authUrl = `/auth?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ""}`;
      throw new Response(null, {
        status: 302,
        headers: { Location: authUrl },
      });
    }
    
    throw new Response(null, {
      status: 302,
      headers: { Location: "/auth" },
    });
  }
}

export default function AppLayout() {
  const { apiKey, shopSession } = useLoaderData<typeof loader>();

  return (
    <AppProvider
      isEmbeddedApp
      apiKey={apiKey}
    >
      <NavMenu>
        <a href="/app" rel="home">Home</a>
        <a href="/app/dashboard">Dashboard</a>
        <a href="/app/portfolios">Portfolios</a>
        <a href="/app/offers">Customer Offers</a>
        <a href="/app/carts">Customer Carts</a>
        <a href="/app/campaigns">Campaigns</a>
        <a href="/app/templates">Templates</a>
        <a href="/app/subscription">Subscription</a>
      </NavMenu>
      
      {/* Provide shop session to all child routes */}
      <ShopSessionContext.Provider value={shopSession}>
        <Outlet />
      </ShopSessionContext.Provider>
    </AppProvider>
  );
}


/*
// app.tsx
import { json, type HeadersFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError, Outlet } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";
import { getShopSession, type ShopSession } from "../lib/queries/appManagement/getShopSession";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getShopSession(request);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopSession: session as ShopSession,
  });
};

export default function App() {
  const { apiKey, shopSession } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={enTranslations}>
      <NavMenu>
        <a href="/app" rel="home">Home</a>
        <a href="/app/dashboard">Dashboard</a>
        <a href="/app/portfolios">Portfolios</a>
        <a href="/app/offers">Customer Offers</a>
        <a href="/app/carts">Customer Carts</a>
        <a href="/app/campaigns">Campaigns</a>
        <a href="/app/templates">Templates</a>
        <a href="/app/subscription">Subscription</a>
      </NavMenu>
      <Outlet context={shopSession as ShopSession} />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
*/