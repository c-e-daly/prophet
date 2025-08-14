// app/routes/app.tsx - Your main Shopify embedded app
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import { createClient } from "../utils/supabase/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import AppNavMenu from "../components/appNavMenu";
import { Frame } from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");
  const apiKey = process.env.SHOPIFY_CLIENT_ID as string;

  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }

  // Get shop info from Supabase
  const supabase = createClient();
  const { data: shopauth } = await supabase
    .from("shopauth")
    .select("shop_name, access_token")
    .eq("id", shop)
    .single();

  return ({
    shop,
    host,
    url: request.url,
    shopName: shopauth?.shop_name || shop,
    hasToken: !!shopauth?.access_token,
    apiKey
  });
}

export default function AppLayout() {
  const { shop, host, shopName, url, hasToken, apiKey } = useLoaderData<typeof loader>();

  return (

    <AppProvider isEmbeddedApp apiKey={apiKey}>
        <Frame navigation={<AppNavMenu />}>
      <Outlet context={{ shop, host }}/>
      </Frame>
    </AppProvider>
  );
}