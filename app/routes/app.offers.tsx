// app/routes/app.offers.tsx
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useSearchParams, Link } from "@remix-run/react";
import { Page, Button } from "@shopify/polaris";
import { getShopSession } from "../lib/session/shopSession.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopsID } = await getShopSession(request);
  return json({ shopsID });
}

export default function OffersLayout() {
  const [sp] = useSearchParams();
  const toReview = sp.toString() ? `review?${sp.toString()}` : "review";

  return (
    <Page title="Offers">
      {/* Use the URL you built */}
      <Button url={toReview}>Review Offers</Button>
      <Outlet />
    </Page>
  );
}










































































































































