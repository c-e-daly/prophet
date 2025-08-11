import { Page, Layout } from '@shopify/polaris';
import { Outlet } from "@remix-run/react";

export default function Portfolios() {
  return (
    <Page>
      <Layout>
        <Outlet />           
      </Layout>
    </Page>
  );
}