// app/routes/app.campaigns.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { useShopSession } from "../../app/routes/app";

 const session = useShopSession();


export default function CampaignsLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}