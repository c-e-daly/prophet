import { Outlet, useLocation } from "@remix-run/react";
import { Page, Button } from "@shopify/polaris";

export default function Campaigns() {

  const location = useLocation();

  return (
    <Page>
        <Outlet key={location.pathname}/>
    </Page>
  );
}
