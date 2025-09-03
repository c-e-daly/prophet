// app/routes/app.carts.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireCompleteShopSession(request);
  
  return json(
    { shopSession },
    { headers: headers ? headers : undefined }
  );
}

export default function CartsLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}




















































































































































