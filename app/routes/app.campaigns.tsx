// app/routes/app.campaigns.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { useShopSession } from "../../app/routes/app";


export async function loader({ request }: LoaderFunctionArgs) {
  const session = useShopSession();
  
  return json(
    { session },
    { headers: headers ? headers : undefined }
  );
}

export default function CampaignsLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}