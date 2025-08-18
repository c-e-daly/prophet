// app/routes/app.tsx
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

/*

/* Shopify needs Remix to catch thrown responses to include headers
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
*/