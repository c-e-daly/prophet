//app.dashboard.tsx 
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, InlineStack, BlockStack, InlineGrid, Box } from "@shopify/polaris";
import { LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Line, Pie, Cell } from "recharts";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";
import { getDashboardSummary } from "../lib/queries/getShopDashboard";


type LoaderData = {
  shopsId: number;
  shopDomain: string;

};


// ---------------- Loader (new) ----------------
export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession } = await requireCompleteShopSession(request);
  const summary = await getDashboardSummary(shopSession.shopsId);
  
  return json({ 
    summary,
    shopSession: {
      shopsId: shopSession.shopsId,
      shopsBrandName: shopSession.shopsBrandName,
      shopDomain: shopSession.shopDomain
    }
  });
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
