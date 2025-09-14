// app/routes/app.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, Link, useSearchParams  } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
// import { ShopifyLink } from "../utils/ShopifyLink";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
   
  });
}

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">Home</a>
        <a href="/app/dashboard">Dashboard</a>
        <a href="/app/portfolios">Portfolios</a>
        <a href="/app/offers">Customer Offers</a>
        <a href="/app/carts">Customer Carts</a>
        <a href="/app/campaigns">Campaigns</a>
        <a href="/app/templates">Templates</a>
        <a href="/app/pricebuilder">Price Builder</a>
        <a href="/app/subscription">Subscription</a>
      </NavMenu>
     <Outlet />
    </AppProvider>
  )
}






/*



        <ShopifyLink to="/app" rel="home">Home</ShopifyLink>
<ShopifyLink to="/app/dashboard">Dashboard</ShopifyLink>
<ShopifyLink to="/app/portfolios">Portfolios</ShopifyLink>
<ShopifyLink to="/app/offers">Customer Offers</ShopifyLink>
<ShopifyLink to="/app/carts">Customer Carts</ShopifyLink>
<ShopifyLink to="/app/campaigns">Campaigns</ShopifyLink>
<ShopifyLink to="/app/templates">Templates</ShopifyLink>
<ShopifyLink to="/app/pricebuilder">Price Builder</ShopifyLink>
<ShopifyLink to="/app/subscription">Subscription</ShopifyLink>

*/