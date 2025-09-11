// app/routes/app.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import type { CompleteShopSession } from "../lib/types/shopSession";
import { requireShopSession } from "../lib/session/shopAuth.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];
export const ShopSessionContext = createContext<CompleteShopSession | null>(null);
export const useShopSession = () => {
  const ctx = useContext(ShopSessionContext);
  if (!ctx) throw new Error("useShopSession must be used within ShopSessionProvider");
  return ctx;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireShopSession(request);
  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      shopSession,
    },
    { headers } // <- CRITICAL: forward Shopify headers (CSP, cookies)
  );
}

export default function AppLayout() {
  const { apiKey, shopSession } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        {/* Use <a> or <Link>; both render anchors which NavMenu needs */}
        <a href="/app" rel="home">Home</a>
        <a href="/app/dashboard">Dashboard</a>
        <a href="/app/portfolios">Portfolios</a>
        <a href="/app/offers">Customer Offers</a>
        <a href="/app/carts">Customer Carts</a>
        <a href="/app/campaigns">Campaigns</a>
        <a href="/app/templates">Templates</a>
        <a href="/app/subscription">Subscription</a>
      </NavMenu>

      <ShopSessionContext.Provider value={shopSession}>
        <Outlet />
      </ShopSessionContext.Provider>
    </AppProvider>
  );
}



/*
// app/routes/app.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css";
import type { CompleteShopSession } from "../lib/types/shopSession";
import { requireShopSession } from "../lib/session/shopAuth.server";

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
    const { shopSession, headers } = await requireShopSession(request);

  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      shopSession,
    },
    { headers }
  );
}

export default function AppLayout() {
  const { apiKey, shopSession } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
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

    
      <ShopSessionContext.Provider value={shopSession}>
        <Outlet />
      </ShopSessionContext.Provider>
    </AppProvider>
  );
}
*/