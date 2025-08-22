import { Page} from '@shopify/polaris';
import { Outlet } from "@remix-run/react";

export default function Offers() {

  return (
    <Page>
      <Outlet />
    </Page>

  );
}