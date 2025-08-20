// app.tsx
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError, Outlet } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from '@shopify/polaris/locales/en.json';
import { authenticate } from "../utils/shopify/shopify.server";
import { Link } from "@remix-run/react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: session.shop,                       // domain (my-shop.myshopify.com)
    shopName: session.shop.replace(".myshopify.com", ""), // crude display name
    hasToken: !!session.accessToken,          // whether we have a token
  };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

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
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
