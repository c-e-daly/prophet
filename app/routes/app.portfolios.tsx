import { Page, Layout, Card, Text} from '@shopify/polaris';
import { Outlet } from "@remix-run/react";

export default function Portfolios() {
  return (
    <Page>
        <Layout> 
          <Layout.Section variant="oneThird">
            <Card>
              <Text as="h3">New Portfolio</Text>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
             <Card>
              <Text as="h3">Growth Portfolio</Text>
             </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
                <Text as="h3">Stable Portfolio</Text>
            </Card>
          </Layout.Section>
        </Layout>
        <Outlet />           
    </Page>
  );
}