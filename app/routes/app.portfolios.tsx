import { Page} from '@shopify/polaris';
import { Outlet } from "@remix-run/react";

export default function Portfolios() {
  return (
    <Page>
        <Outlet />           
    </Page>
  );
}