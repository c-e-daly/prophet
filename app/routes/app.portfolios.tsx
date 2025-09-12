//app/routes/app.portfolios.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData , Outlet} from "@remix-run/react";
import { Page} from "@shopify/polaris";
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
export default function PortfoliosLayout() {
  const { shopSession } = useLoaderData<typeof loader>();
  return (

    <ShopSessionProvider value={shopSession}>
    <Page title="Product Template Deployment">
      <Outlet />
    </Page>
    </ShopSessionProvider>
  );
}