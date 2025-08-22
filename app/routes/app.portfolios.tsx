import { Outlet } from "@remix-run/react";
import {Page, Layout,Card,Text,Button,BlockStack,InlineStack,Box,Badge,Divider} from "@shopify/polaris";
export default function Portfolios() {
 
  return (
    <Page>
        <Outlet />           
    </Page>
  );
}
