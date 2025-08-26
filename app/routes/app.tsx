// app.tsx
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useRouteError, Outlet } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from '@shopify/polaris/locales/en.json';
import { authenticate } from "../utils/shopify/shopify.server";


export const links = () => [{ rel: "stylesheet", href: polarisStyles }];


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
    shop: session.shop,                       
    shopName: session.shop.replace(".myshopify.com", ""), 
    hasToken: !!session.accessToken,         
  };
};

export default function App() {
  const { apiKey, shop, shopName, hasToken } = useLoaderData<typeof loader>();

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
      <Outlet context={{ shop, shopName, hasToken }}/>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
