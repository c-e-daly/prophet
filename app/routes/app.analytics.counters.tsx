// app/routes/app.analytics.counters.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {  Layout, Page, Card, Text, IndexTable} from "@shopify/polaris";
import { formatPercent, formatCurrencyUSD } from "../utils/format";
import { getShopCounterAnalytics, type CounterAnalyticsResult } from "../lib/queries/supabase/getShopCounterAnalytics";
import { COUNTER_TYPE_LABELS } from "../lib/types/counterTypeLabels";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopsID } = await getAuthContext(request);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const stats = await getShopCounterAnalytics(shopsID, {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  return json({ stats });
}

export default function CounterAnalytics() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <Page title="Counter Offer Analytics">
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingLg" as="h2">Performance by Counter Type</Text>
            <IndexTable
              itemCount={stats.byType?.length ?? 0}
              selectable={false}
              headings={[
                { title: 'Counter Type' },
                { title: 'Times Used' },
                { title: 'Accepted' },
                { title: 'Acceptance %' },
                { title: 'Avg Margin' },
                { title: 'Total Revenue' },
              ]}
            >
              {(stats.byType ?? []).map((row, index) => (
                <IndexTable.Row id={String(index)} key={index} position={index}>
                  <IndexTable.Cell>
                    {COUNTER_TYPE_LABELS[row.counter_type as keyof typeof COUNTER_TYPE_LABELS] || row.counter_type}
                  </IndexTable.Cell>
                  <IndexTable.Cell>{row.total_sent}</IndexTable.Cell>
                  <IndexTable.Cell>{row.total_accepted}</IndexTable.Cell>
                  <IndexTable.Cell>{formatPercent(Number(row.acceptance_rate) / 100)}</IndexTable.Cell>
                  <IndexTable.Cell>{formatPercent(Number(row.avg_margin_percent) / 100)}</IndexTable.Cell>
                  <IndexTable.Cell>{formatCurrencyUSD(Number(row.total_revenue_cents))}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Text variant="headingLg" as="h2">Performance by Portfolio</Text>
            <IndexTable
              itemCount={stats.byPortfolio?.length ?? 0}
              selectable={false}
              headings={[
                { title: 'Portfolio' },
                { title: 'Counters Sent' },
                { title: 'Accepted' },
                { title: 'Acceptance %' },
                { title: 'Avg Expected Value' },
              ]}
            >
              {(stats.byPortfolio ?? []).map((row, index) => (
                <IndexTable.Row id={String(index)} key={index} position={index}>
                  <IndexTable.Cell>{row.portfolio}</IndexTable.Cell>
                  <IndexTable.Cell>{row.total_sent}</IndexTable.Cell>
                  <IndexTable.Cell>{row.total_accepted}</IndexTable.Cell>
                  <IndexTable.Cell>{formatPercent(Number(row.acceptance_rate) / 100)}</IndexTable.Cell>
                  <IndexTable.Cell>{formatCurrencyUSD(Number(row.avg_expected_value))}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Text variant="headingLg" as="h2">Team Performance</Text>
            <IndexTable
              itemCount={stats.byUser?.length ?? 0}
              selectable={false}
              headings={[
                { title: 'Team Member' },
                { title: 'Counters Sent' },
                { title: 'Accepted' },
                { title: 'Acceptance %' },
                { title: 'Total Margin' },
              ]}
            >
              {(stats.byUser ?? []).map((row, index) => (
                <IndexTable.Row id={String(index)} key={index} position={index}>
                  <IndexTable.Cell>{row.user_name}</IndexTable.Cell>
                  <IndexTable.Cell>{row.total_sent}</IndexTable.Cell>
                  <IndexTable.Cell>{row.total_accepted}</IndexTable.Cell>
                  <IndexTable.Cell>{formatPercent(Number(row.acceptance_rate) / 100)}</IndexTable.Cell>
                  <IndexTable.Cell>{formatCurrencyUSD(Number(row.total_margin_cents))}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}