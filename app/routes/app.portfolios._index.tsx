import { Page, Layout, Card, Button, Text} from '@shopify/polaris';
import { Link, useSearchParams } from "@remix-run/react";


export default function PortfoliosIndex() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const toGrowth = qs ? `growth?${qs}` : "growth";
  return (
    <Page
     title="Portfolios"
      primaryAction={<Button onClick={() => (window.location.href = toGrowth)}>Go to Growth</Button>}
    >
    <Layout> 
      <Text variant="headingLg" as="h2">Portfolios Index</Text>
            {/* Prefer client nav; if your embedded shell eats it, use reloadDocument */}
            <Link to={toGrowth} prefetch="intent" replace>
              Go to Growth (client nav)
            </Link>
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
    <Layout.Section variant="oneThird">
      <Card>
       <Text as="h3">Reactivated Portfolio</Text>
      </Card>
   </Layout.Section>
  <Layout.Section variant="oneThird">
     <Card>
       <Text as="h3">Declining Portfolio</Text>
     </Card>
    </Layout.Section>
 <Layout.Section variant="oneThird">
     <Card>
     <Text as="h3">Defected Portfolio</Text>
    </Card>
  </Layout.Section>
 </Layout>
 </Page>
 )
}