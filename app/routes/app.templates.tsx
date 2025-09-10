import {Page, Layout,Card,Text,Button,BlockStack,InlineStack,Box,Badge,Divider} from "@shopify/polaris";
import { useShopSession } from "./app";


type LoaderData = {
  shopsId: number;
  shopDomain: string;

};

export async function loader({ request }: LoaderFunctionArgs) {
    const shopSession = useShopSession();
}

export default function Templates(){

    return (
        <Page />
    );
}