import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Box } from '@shopify/polaris';
import { BarChart, LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar, Line, Pie, Cell } from 'recharts';
import { getDashboardSummary } from "../lib/queries/dashboard_sales_summary";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../utils/shopify/shopify.server";

// ---------- Loader ----------
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const summary = await getDashboardSummary(shop);
  return { summary, shop };
}

// ---------- Types (match your JSONB contract) ----------
type RangeBlock = { consumers: number; order_count: number; gross_sales: number; nor_sales: number; aov: number };

type Summary = {
  today: RangeBlock;
  wtd: RangeBlock;
  mtd: RangeBlock;
  ytd: RangeBlock;
  nor_by_month: Array<{ month: string; cytd: number; pytd: number }>;
  category_ytd_top5: Array<{ category: string; sales: number }>;
  portfolios: {
    new: { cy: RangeBlock; py: RangeBlock };
    stable: { cy: RangeBlock; py: RangeBlock };
    growth: { cy: RangeBlock; py: RangeBlock };
    declining: { cy: RangeBlock; py: RangeBlock };
  };
};

// ---------- Utils ----------
const fmtCurrency = (n: number) =>
  (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtNumber = (n: number) => (n ?? 0).toLocaleString();

const fmtAOV = (n: number) =>
  (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const pctChange = (cy: number, py: number) => {
  if (!py) return 0;
  return ((cy - py) / py) * 100;
};

const COLORS = ['#0442bf', '#80bf9b', '#d6e5f0', '#bf7f7f', '#bfbf80'];

// ---------- Small stat block used inside cards ----------
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <InlineStack align="space-between">
      <Text as="span" variant="bodyMd" tone="subdued">{label}</Text>
      <Text as="span" variant="bodyMd" fontWeight="semibold">{value}</Text>
    </InlineStack>
  );
}

// Linecharts on NOR Sales



// ---------- Portfolio card ----------
function PortfolioCard({
  title,
  cy,
  py
}: {
  title: string;
  cy: RangeBlock;
  py: RangeBlock;
}) {
  const rows = [
    {
      label: 'Orders',
      cy: fmtNumber(cy?.order_count || 0),
      py: fmtNumber(py?.order_count || 0),
      delta: pctChange(cy?.order_count || 0, py?.order_count || 0)
    },
    {
      label: 'Gross Sales',
      cy: fmtCurrency(cy?.gross_sales || 0),
      py: fmtCurrency(py?.gross_sales || 0),
      delta: pctChange(cy?.gross_sales || 0, py?.gross_sales || 0)
    },
    {
      label: 'NOR Sales',
      cy: fmtCurrency(cy?.nor_sales || 0),
      py: fmtCurrency(py?.nor_sales || 0),
      delta: pctChange(cy?.nor_sales || 0, py?.nor_sales || 0)
    },
    {
      label: 'Consumers',
      cy: fmtNumber(cy?.consumers || 0),
      py: fmtNumber(py?.consumers || 0),
      delta: pctChange(cy?.consumers || 0, py?.consumers || 0)
    },
    {
      label: 'AOV',
      cy: fmtAOV(cy?.aov || 0),
      py: fmtAOV(py?.aov || 0),
      delta: pctChange(cy?.aov || 0, py?.aov || 0)
    }
  ];

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h4" variant="headingMd">{title}</Text>
        {rows.map((r) => (
          <InlineStack key={r.label} align="space-between" blockAlign="center">
            <Text as="span" tone="subdued">{r.label}</Text>
            <InlineStack gap="200" blockAlign="center">
              <Text as="span">{r.cy}</Text>
              <Text as="span" tone="subdued">vs {r.py}</Text>
              <Text as="span" tone={r.delta >= 0 ? 'success' : 'critical'}>
                {r.delta >= 0 ? '▲' : '▼'} {Math.abs(r.delta).toFixed(1)}%
              </Text>
            </InlineStack>
          </InlineStack>
        ))}
      </BlockStack>
    </Card>
  );
}

// ---------- Top-level Dashboard ----------
export default function Dashboard() {
  const { summary } = useLoaderData<{ summary: Summary }>();

  // Guards/fallbacks so the UI renders even if some arrays are empty
  const norSeries = summary?.nor_by_month ?? [];
  const catTop5 = summary?.category_ytd_top5 ?? [];

  return (
    <Page title="Performance Dashboard">
      <Layout>

        {/* Row 1: 4 summary cards (Today, WTD, MTD, YTD) */}
        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h4" variant="headingMd">Today’s Sales</Text>
                <StatRow label="Orders" value={fmtNumber(summary?.today?.order_count || 0)} />
                <StatRow label="Gross Sales" value={fmtCurrency(summary?.today?.gross_sales || 0)} />
                <StatRow label="NOR Sales" value={fmtCurrency(summary?.today?.nor_sales || 0)} />
                <StatRow label="AOV" value={fmtAOV(summary?.today?.aov || 0)} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h4" variant="headingMd">Week‑to‑Date</Text>
                <StatRow label="Orders" value={fmtNumber(summary?.wtd?.order_count || 0)} />
                <StatRow label="Gross Sales" value={fmtCurrency(summary?.wtd?.gross_sales || 0)} />
                <StatRow label="NOR Sales" value={fmtCurrency(summary?.wtd?.nor_sales || 0)} />
                <StatRow label="AOV" value={fmtAOV(summary?.wtd?.aov || 0)} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h4" variant="headingMd">Month‑to‑Date</Text>
                <StatRow label="Orders" value={fmtNumber(summary?.mtd?.order_count || 0)} />
                <StatRow label="Gross Sales" value={fmtCurrency(summary?.mtd?.gross_sales || 0)} />
                <StatRow label="NOR Sales" value={fmtCurrency(summary?.mtd?.nor_sales || 0)} />
                <StatRow label="AOV" value={fmtAOV(summary?.mtd?.aov || 0)} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h4" variant="headingMd">Year‑to‑Date</Text>
                <StatRow label="Orders" value={fmtNumber(summary?.ytd?.order_count || 0)} />
                <StatRow label="Gross Sales" value={fmtCurrency(summary?.ytd?.gross_sales || 0)} />
                <StatRow label="NOR Sales" value={fmtCurrency(summary?.ytd?.nor_sales || 0)} />
                <StatRow label="AOV" value={fmtAOV(summary?.ytd?.aov || 0)} />
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Row 2: two charts (NOR CYTD vs PYTD) | (Top 5 Categories YTD) */}
        <Layout.Section>
          <InlineGrid columns={2} gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">NOR Sales: CYTD vs PYTD</Text>
                <Box>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={norSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cytd" name="CYTD NOR" dot={false} />
                      <Line type="monotone" dataKey="pytd" name="PYTD NOR" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Top 5 Categories by Sales (YTD)</Text>
                <Box>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={catTop5}
                        dataKey="sales"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={60} // doughnut
                        label={(d) => d.category}
                      >
                        {catTop5.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Row 3: four portfolio cards */}
        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            <PortfolioCard title="New Portfolio" cy={summary?.portfolios?.new?.cy || ({} as RangeBlock)} py={summary?.portfolios?.new?.py || ({} as RangeBlock)} />
            <PortfolioCard title="Stable Portfolio" cy={summary?.portfolios?.stable?.cy || ({} as RangeBlock)} py={summary?.portfolios?.stable?.py || ({} as RangeBlock)} />
            <PortfolioCard title="Growth Portfolio" cy={summary?.portfolios?.growth?.cy || ({} as RangeBlock)} py={summary?.portfolios?.growth?.py || ({} as RangeBlock)} />
            <PortfolioCard title="Declining Portfolio" cy={summary?.portfolios?.declining?.cy || ({} as RangeBlock)} py={summary?.portfolios?.declining?.py || ({} as RangeBlock)} />
          </InlineGrid>
        </Layout.Section>

      </Layout>
    </Page>
  );
}



/*
import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Divider, Badge, Box} from '@shopify/polaris';
import { BarChart, LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar, Line, Pie, Cell} from 'recharts';
import { getDashboardSummary } from "../lib/queries/dashboard_sales_summary";
import { type LoaderFunctionArgs } from "@remix-run/node";


export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) throw new Error("Missing shop");

  const summary = await getDashboardSummary(shop);
  return ({ summary, shop });
}


const dashboardMetrics = {
  customers: 60000,
  annualSales: 2500000,
  aov: 189,
  avgVisits: 2.89,
  avgItems: 4.8,
  nrr: 46.2,
  paybackDays: 132
};

const revenueByMonth = [ 
  { month: 'Jan', revenue: 210000 },
  { month: 'Feb', revenue: 180000 },
  { month: 'Mar', revenue: 235000 },
  { month: 'Apr', revenue: 190000 },
  { month: 'May', revenue: 200000 },
  { month: 'Jun', revenue: 240000 }
];

const visitFrequencies = [
  { type: '1 Visit', value: 18000 },
  { type: '2 Visits', value: 22000 },
  { type: '3+ Visits', value: 20000 }
];

const COLORS = ['#0442bf', '#80bf9b', '#d6e5f0'];

export default function Dashboard() {
  return (
    <Page title="Performance Dashboard">
      <Layout>
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            <Card>
              <BlockStack>
                <Text as="h4" variant="headingMd">Total Customers</Text>
                <Text as="h2" variant="bodyLg" fontWeight="semibold">{dashboardMetrics.customers.toLocaleString()}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack>
                <Text as="h4" variant="headingMd">Annual Sales</Text>
                <Text as="h2" variant="bodyLg" fontWeight="semibold">${dashboardMetrics.annualSales.toLocaleString()}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack>
                <Text as="h4" variant="headingMd">Net Revenue Retention</Text>
                <Text as="h2" variant="bodyLg" fontWeight="semibold">{dashboardMetrics.nrr}%</Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            <Card >
                <Text as="h3" variant="headingMd">Revenue by Month</Text>
              <Box >
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0442bf" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card >
                <Text as="h3" variant="headingMd">Repeat Purchase Rate</Text>
              <Box>
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={visitFrequencies}
                      dataKey="value"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {visitFrequencies.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Text as="h3" variant="headingMd">Efficiency Metrics</Text>
            <BlockStack gap="200">
              <InlineStack>
                <Text as="h4" variant="bodyMd">Average Order Value:</Text>
                <Text as="h3" fontWeight="semibold">${dashboardMetrics.aov}</Text>
              </InlineStack>
              <InlineStack>
                <Text as="h4" variant="bodyMd">Average Customer Visits per Year:</Text>
                <Text as="h3" fontWeight="semibold">{dashboardMetrics.avgVisits}</Text>
              </InlineStack>
              <InlineStack>
                <Text as="h4" variant="bodyMd">Average Items per Order:</Text>
                <Text as="h3" fontWeight="semibold">{dashboardMetrics.avgItems}</Text>
              </InlineStack>
              <InlineStack>
                <Text as="h4" variant="bodyMd">Payback Period:</Text>
                <Text as="h3" fontWeight="semibold">{dashboardMetrics.paybackDays} days</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
*/