import { Outlet } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { useShopSession } from "./app";

  const session = useShopSession();

export default function PriceBuilderLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}