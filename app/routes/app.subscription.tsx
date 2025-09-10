
import {Page} from "@shopify/polaris";
import { Outlet } from "@remix-run/react";
import { useShopSession } from "../../app/routes/app";

const session= useShopSession();

export default function Subscription() {
  return (
  <Page> 
  <Outlet />
  </Page>
  );
}
