// app/routes/app.tsx - Main authenticated app (no Shopify auth calls)

import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { type LoaderFunctionArgs, type LinksFunction, type HeadersFunction, json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Card, Page, Layout, Text } from "@shopify/polaris";
import { createClient } from "../utils/supabase/server";

type LoaderData = {
  apiKey: string;
  shop: string;
  authenticated: boolean;
};

export const links: LinksFunction = () => [
  { 
    rel: "stylesheet", 
    href: "https://unpkg.com/@shopify/polaris@latest/build/esm/styles.css" 
  },
];

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoaderData> => {
  console.log("=== APP LOADER START ===");
  
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    throw new Response("Shop parameter required", { status: 400 });
  }

  // Check if shop is authenticated in Supabase
  const supabase = createClient();
  
  const { data: shopRecord } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", shop)
    .single();

  if (!shopRecord) {
    throw new Response("Shop not found", { status: 404 });
  }

  const { data: shopAuth } = await supabase
    .from("shopAuths")
    .select("access_token")
    .eq("shop_id", shopRecord.id)
    .single();

  const authenticated = !!shopAuth?.access_token;
  
  console.log("App loader - Shop:", shop, "Authenticated:", authenticated);

  return {
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
    shop: shop,
    authenticated
  };
};

export default function App() {
  const { apiKey, shop, authenticated } = useLoaderData<LoaderData>();

  if (!authenticated) {
    return (
      <div>
        <h1>Not Authenticated</h1>
        <p>Shop {shop} is not properly authenticated.</p>
      </div>
    );
  }

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