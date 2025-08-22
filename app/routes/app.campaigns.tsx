import { Outlet, useSearchParams } from "@remix-run/react";
import { Page, Button } from "@shopify/polaris";

export default function CampaignsLayout() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const toCreate = qs ? `create?${qs}` : "create"; // keep shop/host

  return (
    <Page title="Campaigns"
      primaryAction={<Button url={toCreate} variant="primary">Create campaign</Button>} >
        <Outlet />
    </Page>
  );
}
