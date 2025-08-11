import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Divider, Badge, Box} from '@shopify/polaris';

import { Outlet } from "@remix-run/react";


export default function Portfolios() {

  return (
    <Page>
        <Layout>
            <Text as="h1">Customer Portfolios</Text>
            <Outlet />           
        </Layout>
    </Page>
  
  );
}