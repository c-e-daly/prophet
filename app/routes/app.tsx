import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
  type LoaderFunctionArgs,
  type LinksFunction,
  type HeadersFunction,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../lib/shopify.server";

type LoaderData = {
  apiKey: string;
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoaderData> => {
  await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_CLIENT_ID_DEV || "",
  };
};

export default function App() {
  const { apiKey } = useLoaderData<LoaderData>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch thrown responses so headers are applied
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
