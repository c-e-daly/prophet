import { Outlet, useSearchParams } from "@remix-run/react";
import { Page, Button } from "@shopify/polaris";

export default function Campaigns() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const toCreate = qs ? `create?${qs}` : "create"; // keep shop/host

  return (
    <Page>
        <Outlet />
    </Page>
  );
}
