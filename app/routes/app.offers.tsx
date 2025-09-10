// app/routes/app.offers.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useSearchParams } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { getShopSession } from "../lib/session/shopSession.server";


export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getShopSession(request);
  
  return json(
    { session },
  );
}

export default function OffersLayout() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const toReview = qs ? `review?${qs}` : "review"; // keep shop/host

  return (
    <Page>
      <Outlet />
    </Page>
  );
}










































































































































