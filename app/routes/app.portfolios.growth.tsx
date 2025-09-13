import { Page,  Button, Layout, Card, Text} from '@shopify/polaris';
import { Link, useSearchParams } from "@remix-run/react";
import { BreadcrumbsBar } from "../components/BreadcrumbsBar";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";

export default function GrowthPortfolio() {
  const [sp] = useSearchParams();
  const qs = sp.toString();
  const backTo = qs ? `..?${qs}` : "..";
  return (
    <Page title="Growth Portfolio">
      <Layout>
        <BreadcrumbsBar items={[
          { to: "..", label: "Portfolios", relative: "route" },
          { to: ".", label: "Growth" },
          ]} />
        <Layout.Section>

          <Card>
            <div style={{ height: 120 }} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}