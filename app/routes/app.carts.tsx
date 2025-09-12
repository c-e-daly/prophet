// app/routes/app.carts.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, List, Banner, Text } from "@shopify/polaris";
import { ShopSessionProvider } from "../context/shopSession";
import { requireShopSession } from "../lib/session/shopAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireShopSession(request);
  return json(
    {
      shopSession,
    } as const,
    { headers }
  );
}
export default function Carts() {
  const { shopSession } = useLoaderData<typeof loader>();
  return (

    <ShopSessionProvider value={shopSession}>
    <Page title="Product Template Deployment">
    </Page>
    </ShopSessionProvider>
  );
}






























































































































































