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


/* app.tsx
import { json, type HeadersFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useRouteError, Outlet } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";
import { getShopSession, type ShopSession } from "../lib/queries/getShopSession";


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
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/dashboard">Dashboard</Link>
        <Link to="/app/portfolios">Portfolios</Link>
        <Link to="/app/offers">Customer Offers</Link>
        <Link to="/app/carts">Customer Carts</Link>
        <Link to="/app/campaigns">Campaigns</Link>
        <Link to="/app/templates">Templates</Link>
        <Link to="/app/subscription">Subscription</Link>
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