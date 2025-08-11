import { Page, Layout, Card, Text} from '@shopify/polaris';

export default function PortfoliosIndex() {
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