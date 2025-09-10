import {Page, Layout,Card,Text,Button,BlockStack,InlineStack,Box,Badge,Divider} from "@shopify/polaris";
import { useShopSession } from "./app";


const session = await useShopSession();

export default function Templates(){

    return (
        <Page />
    );
}