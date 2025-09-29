// app/routes/app.analytics.counters.tsx
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server"
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {  Layout, Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge,
  TextField, Select
} from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import { formatDate } from "../utils/format";
import { Tables } from "../lib/types/dbTables";
import { getShopCounterAnalytics } from "../lib/queries/supabase/getShopCounterAnalytics";
import { COUNTER_TYPE_LABELS } from "../lib/types/counterTypes";

export default function CounterAnalytics() {
  export async function loader({ request }: LoaderFunctionArgs) {
    const { shopsID, currentUserId } = await getAuthContext(request);


    return (
      <Page title="Counter Offer Analytics">
        <Layout>
          <Layout.Section>
            <Card>
              <Text variant="headingLg" as="h2">Performance by Counter Type</Text>
              <IndexTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric', 'numeric']}
                headings={[
                  'Counter Type',
                  'Times Used',
                  'Accepted',
                  'Acceptance %',
                  'Avg Margin',
                  'Total Revenue',
                ]}
                rows={stats.byType.map(row => [
                  COUNTER_TYPE_LABELS[row.counter_type],
                  row.total_sent,
                  row.total_accepted,
                  formatPercent(row.acceptance_rate),
                  formatPercent(row.avg_margin_percent / 100),
                  formatCurrencyUSD(row.total_revenue_cents),
                ])}
              />
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Text variant="headingLg" as="h2">Performance by Portfolio</Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric']}
                headings={[
                  'Portfolio',
                  'Counters Sent',
                  'Accepted',
                  'Acceptance %',
                  'Avg Expected Value',
                ]}
                rows={stats.byPortfolio.map(row => [
                  row.portfolio,
                  row.total_sent,
                  row.total_accepted,
                  formatPercent(row.acceptance_rate),
                  formatCurrencyUSD(row.avg_expected_value),
                ])}
              />
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Text variant="headingLg" as="h2">Team Performance</Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric']}
                headings={[
                  'Team Member',
                  'Counters Sent',
                  'Accepted',
                  'Acceptance %',
                  'Total Margin',
                ]}
                rows={stats.byUser.map(row => [
                  row.user_name,
                  row.total_sent,
                  row.total_accepted,
                  formatPercent(row.acceptance_rate),
                  formatCurrencyUSD(row.total_margin_cents),
                ])}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }