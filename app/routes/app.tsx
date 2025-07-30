// app/routes/app.tsx - Main authenticated app

import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { type LoaderFunctionArgs, type LinksFunction, type HeadersFunction } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Card, Page, Layout, Text } from "@shopify/polaris";

import { authenticate } from "../lib/shopify.server";

type LoaderData = {
  apiKey: string;
  shop: string;
};

export const links: LinksFunction = () => [
  { 
    rel: "stylesheet", 
    href: "https://unpkg.com/@shopify/polaris@latest/build/esm/styles.css" 
  },
];

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoaderData> => {
  console.log("=== APP LOADER START ===");
  
  // Authenticate the request - this should work now since OAuth is complete
  const { session } = await authenticate.admin(request);
  
  console.log("App authenticated for shop:", session.shop);

  return {
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
    shop: session.shop,
  };
};

export default function App() {
  const { apiKey, shop } = useLoaderData<LoaderData>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
      </NavMenu>
      
      {/* Home page content */}
      <Page title="PROPHET Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <Text variant="headingLg" as="h1">
                Welcome to PROPHET
              </Text>
              <Text variant="bodyMd" as="p">
                Successfully connected to: <strong>{shop}</strong>
              </Text>
              <Text variant="bodyMd" as="p">
                Your OAuth flow is working! Shop and authentication records have been created in Supabase.
              </Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      
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