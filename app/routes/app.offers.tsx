// app/routes/app.offers.tsx
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { Page, Button } from "@shopify/polaris"
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      session
    }
  );
}



export default function OffersLayout() {
   const { session } = useLoaderData<typeof loader>();
  return (
    <Page title="Customer Generated Offers">
          
      <Outlet />
    </Page>
  );
}










































































































































