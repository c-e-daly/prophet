// app/routes/app.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../utils/shopify/shopify.server";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { ShopifyLink } from "../utils/ShopifyLink";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }: LoaderFunctionArgs) {
  // Use Shopify's built-in authentication - this won't redirect during auth flow
  const { admin, session } = await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
    shop: session.shop,
    // Pass minimal session data needed for the app
    shopSession: {
      shopDomain: session.shop,
      shopName: session.shop.replace(".myshopify.com", ""),
      hasToken: !!session.accessToken,
    }
  });
}

export default function AppLayout() {
  const { apiKey, shop, shopSession } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <ShopifyLink to="/app" rel="home">Home</ShopifyLink>
        <ShopifyLink to="/app/dashboard">Dashboard</ShopifyLink>
        <ShopifyLink to="/app/portfolios">Portfolios</ShopifyLink>
        <ShopifyLink to="/app/offers">Customer Offers</ShopifyLink>
        <ShopifyLink to="/app/carts">Customer Carts</ShopifyLink>
        <ShopifyLink to="/app/campaigns">Campaigns</ShopifyLink>
        <ShopifyLink to="/app/templates">Templates</ShopifyLink>
        <ShopifyLink to="/app/pricebuilder">Price Builder</ShopifyLink>
        <ShopifyLink to="/app/subscription">Subscription</ShopifyLink>
      </NavMenu>
      <Outlet context={{ shopSession }} />
    </AppProvider>
  );
}

/*
// app/routes/app.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, Link, useSearchParams  } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import type { CompleteShopSession } from "../lib/types/shopSession";
import { requireShopSession } from "../lib/session/shopAuth.server";
import { ShopifyLink } from "../utils/ShopifyLink";

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
    } as const,
    { headers } );
}

export default function AppLayout() {
  const { apiKey, shopSession } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <ShopifyLink to="/app" rel="home">Home</ShopifyLink>
        <ShopifyLink to="/app/dashboard">Dashboard</ShopifyLink>
        <ShopifyLink to="/app/portfolios">Portfolios</ShopifyLink>
        <ShopifyLink to="/app/offers">Customer Offers</ShopifyLink>
        <ShopifyLink to="/app/carts">Customer Carts</ShopifyLink>
        <ShopifyLink to="/app/campaigns">Campaigns</ShopifyLink>
        <ShopifyLink to="/app/templates">Templates</ShopifyLink>
        <ShopifyLink to="/app/pricebuilder">Price Builder</ShopifyLink>
        <ShopifyLink to="/app/subscription">Subscription</ShopifyLink>
      </NavMenu>
        <Outlet />
    </AppProvider>
  );
}
*/