// app.tsx
import { json, type HeadersFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useRouteError, Outlet } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";
import { getShopSession, type ShopSession } from "../lib/queries/getShopSession";
import { KeepContextLink } from "../components/KeepContextLink";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getShopSession(request, {allowUnauthedPings: true});

  if (session === null) {
    return json({ apiKey: process.env.SHOPIFY_API_KEY || "", shopSession: null });
  }

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
        <KeepContextLink to="/app" rel="home">Home</KeepContextLink>
        <KeepContextLink to="/app/dashboard">Dashboard</KeepContextLink>
        <KeepContextLink to="/app/portfolios">Portfolios</KeepContextLink>
        <KeepContextLink to="/app/offers">Customer Offers</KeepContextLink>
        <KeepContextLink to="/app/carts">Customer Carts</KeepContextLink>
        <KeepContextLink to="/app/campaigns">Campaigns</KeepContextLink>
        <KeepContextLink to="/app/templates">Templates</KeepContextLink>
        <KeepContextLink to="/app/subscription">Subscription</KeepContextLink>
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
