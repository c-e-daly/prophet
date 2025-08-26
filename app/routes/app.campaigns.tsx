//app/routes/app.campaigns.tsx - campaigns layout page

import { Outlet } from "@remix-run/react";
import {Page } from "@shopify/polaris";
export default function Campaigns() {
 
  return (
    <Page>
        <Outlet />           
    </Page>
  );
}
