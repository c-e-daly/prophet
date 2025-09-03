// app/routes/app.offers.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useSearchParams } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";

// This loader ensures all nested routes have a complete shop session
export async function loader({ request }: LoaderFunctionArgs) {
  // This will redirect to auth/install if no session exists
  // or redirect to /install/complete if shop not in database
  const { shopSession, headers } = await requireCompleteShopSession(request);
  
  return json(
    { shopSession },
    { headers: headers ? headers : undefined }
  );
}

export default function OffersLayout() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const toReview = qs ? `review?${qs}` : "review"; // keep shop/host

  return (
    <Page>
      {/* All nested routes now have guaranteed session access via context */}
      <Outlet />
    </Page>
  );
}










































































































































