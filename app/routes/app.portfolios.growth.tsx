import { Page,  Button, Layout, Card, Text} from '@shopify/polaris';
import { Link, useSearchParams } from "@remix-run/react";

export default function GrowthPortfolio() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const backTo = qs ? `..?${qs}` : "..";
  return (
    <Page title="Growth Portfolio">
      <Layout>
        <Layout.Section>
          <Text variant="heading2xl" as="h1">Growth Portfolio</Text>

          {/* Option A: Remix client nav */}
          <Link to={backTo} relative="route" replace>
            ← Return to Portfolios
          </Link>

          {/* Option B: Hard reload (if your embedded frame swallows client nav) */}
          {/* <Button onClick={() => (window.location.href = backTo)}>
            Return to Portfolios
          </Button> */}

          <Card>
            <div style={{ height: 120 }} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}