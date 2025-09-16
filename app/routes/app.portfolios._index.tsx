import * as React from "react";
import { useNavigate } from "@remix-run/react";
import { Page, Card, Text, Box, InlineGrid, BlockStack } from "@shopify/polaris";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell} from "recharts";
import { Link as PolarisLink } from "@shopify/polaris";

type DecilePoint = { d: string; revenueGrowthPct: number };
type MetricBox = {
  key: "grossProfit" | "timeBetweenOrders" | "aov";
  title: string;
  yoyPct: number;
  valueCY: string;
  valuePY: string;
  trend: "up" | "down" | "flat";
};
type PortfolioSnapshot = {
  name: string;
  slug: string;
  decileGrowth: DecilePoint[]; // D1..D10
  metrics: MetricBox[];
};

const MOCK_SNAPSHOTS: PortfolioSnapshot[] = [
  {
    name: "Growth",
    slug: "growth",
    decileGrowth: [
      { d: "D1", revenueGrowthPct: 9 }, { d: "D2", revenueGrowthPct: 8 },
      { d: "D3", revenueGrowthPct: 7 }, { d: "D4", revenueGrowthPct: 6 },
      { d: "D5", revenueGrowthPct: 5 }, { d: "D6", revenueGrowthPct: 4 },
      { d: "D7", revenueGrowthPct: 3 }, { d: "D8", revenueGrowthPct: 2 },
      { d: "D9", revenueGrowthPct: 1 }, { d: "D10", revenueGrowthPct: 0.5 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 12.4, valueCY: "$1.28M", valuePY: "$1.14M", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -6.1, valueCY: "41.8 days", valuePY: "44.6 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 5.7, valueCY: "$86.40", valuePY: "$81.75", trend: "up" },
    ],
  },
  // …repeat for Value, New, Stable, Declining, Reactivated (same as before; omitted here for brevity)
];

// light grey background (Polaris subdued surface)
const subduedBg = { background: "var(--p-color-bg-subdued)" };

const TrendLabel: React.FC<{ pct: number; trend: "up"|"down"|"flat" }> = ({ pct, trend }) => {
  const tone = trend === "up" ? "success" : trend === "down" ? "critical" : "subdued";
  const sign = pct > 0 ? "+" : "";
  return <Text as="span" tone={tone} variant="bodySm">{`${sign}${pct.toFixed(1)}% YOY`}</Text>;
};

const MetricBoxView: React.FC<{ m: MetricBox }> = ({ m }) => (
  <Box padding="300" borderRadius="200" background="bg-surface-secondary">
    <BlockStack gap="100">
      <Text as="h4" variant="headingSm">{m.title}</Text>
      <Text as="p" variant="bodySm">CY: {m.valueCY}</Text>
      <Text as="p" variant="bodySm">PY: {m.valuePY}</Text>
      <TrendLabel pct={m.yoyPct} trend={m.trend} />
    </BlockStack>
  </Box>
);

// Pie chart: each slice = current YTD revenue growth for a decile
const DecileGrowthPie: React.FC<{ data: DecilePoint[] }> = ({ data }) => (
  <Box minHeight="180px">
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Pie
          data={data}
          dataKey="revenueGrowthPct"
          nameKey="d"
          innerRadius={40}
          outerRadius={70}
          strokeWidth={1}
        >
          {data.map((_, i) => (
            // default colors are fine; no custom palette needed
            <Cell key={`cell-${i}`} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </Box>
);

const PortfolioCard: React.FC<{ snapshot: PortfolioSnapshot }> = ({ snapshot }) => {
  const navigate = useNavigate();
  const route = `/app/portfolios/${snapshot.slug}`;

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">{snapshot.name} Portfolio</Text>

          <InlineGrid columns={2} gap="400">
            {/* Left: Decile pie */}
            <BlockStack gap="200">
              <Text as="span" variant="bodySm" tone="subdued">
                Revenue Growth by Decile (YTD)
              </Text>
              <DecileGrowthPie data={snapshot.decileGrowth} />
            </BlockStack>

            {/* Right: stack boxes vertically */}
            <BlockStack gap="300">
              {snapshot.metrics.map((m) => (
                <MetricBoxView key={m.key} m={m} />
              ))}
            </BlockStack>
          </InlineGrid>
            <PolarisLink url={route}>
              {`Explore ${snapshot.name} Portfolio →`}
            </PolarisLink>
        </BlockStack>
      </Box>
    </Card>
  );
};

export default function PortfoliosIndexPage() {
  const snapshots = MOCK_SNAPSHOTS;

  return (
    <Page title="Portfolios">
      <BlockStack gap="400">
        <Text as="p" tone="subdued">
          Snapshots: left pie shows YTD revenue growth by decile; right column shows key measures.
        </Text>
        <InlineGrid columns={2} gap="400">
          {snapshots.map((snap) => (
            <PortfolioCard key={snap.slug} snapshot={snap} />
          ))}
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}



/*
// app/routes/app.portfolios._index.tsx
import * as React from "react";
import { Link, useNavigate } from "@remix-run/react";
import { Page, Card, Text, Box, InlineGrid, BlockStack, Button } from "@shopify/polaris";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar
} from "recharts";

// ---- Types & mock data (swap with real loader data later) ----
type QuintilePoint = { q: string; revenueGrowthPct: number };
type MetricBox = {
  key: "grossProfit" | "timeBetweenOrders" | "aov";
  title: string;
  yoyPct: number;      // e.g. +8.3
  valueCY: string;     // formatted
  valuePY: string;     // formatted
  trend: "up" | "down" | "flat";
};

type PortfolioSnapshot = {
  name: string; // e.g., "Growth"
  slug: string; // route segment, e.g., "growth"
  quintileGrowth: QuintilePoint[]; // Q1..Q5 revenue growth %
  metrics: MetricBox[];
};

// Helper to tint backgrounds
const tint = {
  blue: "rgba(36, 99, 235, 0.08)",   // light blue
  green: "rgba(16, 185, 129, 0.12)", // light green
  orange: "rgba(245, 158, 11, 0.12)" // light orange
};

// Example data for 6 portfolios
const MOCK_SNAPSHOTS: PortfolioSnapshot[] = [
  {
    name: "Growth",
    slug: "growth",
    quintileGrowth: [
      { q: "Q1", revenueGrowthPct: 22 },
      { q: "Q2", revenueGrowthPct: 17 },
      { q: "Q3", revenueGrowthPct: 11 },
      { q: "Q4", revenueGrowthPct: 6 },
      { q: "Q5", revenueGrowthPct: 2 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 12.4, valueCY: "$1.28M", valuePY: "$1.14M", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -6.1, valueCY: "41.8 days", valuePY: "44.6 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 5.7, valueCY: "$86.40", valuePY: "$81.75", trend: "up" },
    ],
  },
  {
    name: "Value",
    slug: "value",
    quintileGrowth: [
      { q: "Q1", revenueGrowthPct: 14 },
      { q: "Q2", revenueGrowthPct: 11 },
      { q: "Q3", revenueGrowthPct: 8 },
      { q: "Q4", revenueGrowthPct: 4 },
      { q: "Q5", revenueGrowthPct: 1 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 7.9, valueCY: "$964k", valuePY: "$893k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -2.2, valueCY: "48.9 days", valuePY: "50.0 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 2.3, valueCY: "$63.10", valuePY: "$61.70", trend: "up" },
    ],
  },
  {
    name: "New",
    slug: "new",
    quintileGrowth: [
      { q: "Q1", revenueGrowthPct: 35 },
      { q: "Q2", revenueGrowthPct: 21 },
      { q: "Q3", revenueGrowthPct: 9 },
      { q: "Q4", revenueGrowthPct: 5 },
      { q: "Q5", revenueGrowthPct: 1 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 18.2, valueCY: "$402k", valuePY: "$340k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -9.3, valueCY: "61.4 days", valuePY: "67.7 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 4.2, valueCY: "$54.00", valuePY: "$51.80", trend: "up" },
    ],
  },
  {
    name: "Stable",
    slug: "stable",
    quintileGrowth: [
      { q: "Q1", revenueGrowthPct: 9 },
      { q: "Q2", revenueGrowthPct: 7 },
      { q: "Q3", revenueGrowthPct: 5 },
      { q: "Q4", revenueGrowthPct: 3 },
      { q: "Q5", revenueGrowthPct: 1 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 3.1, valueCY: "$1.02M", valuePY: "$990k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -1.1, valueCY: "36.2 days", valuePY: "36.6 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 1.4, valueCY: "$72.30", valuePY: "$71.30", trend: "up" },
    ],
  },
  {
    name: "Declining",
    slug: "declining",
    quintileGrowth: [
      { q: "Q1", revenueGrowthPct: -3 },
      { q: "Q2", revenueGrowthPct: -6 },
      { q: "Q3", revenueGrowthPct: -9 },
      { q: "Q4", revenueGrowthPct: -12 },
      { q: "Q5", revenueGrowthPct: -15 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: -8.9, valueCY: "$611k", valuePY: "$671k", trend: "down" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: 7.5, valueCY: "59.8 days", valuePY: "55.6 days", trend: "up" },
      { key: "aov", title: "AOV", yoyPct: -3.7, valueCY: "$61.70", valuePY: "$64.00", trend: "down" },
    ],
  },
  {
    name: "Reactivated",
    slug: "reactivated",
    quintileGrowth: [
      { q: "Q1", revenueGrowthPct: 28 },
      { q: "Q2", revenueGrowthPct: 19 },
      { q: "Q3", revenueGrowthPct: 12 },
      { q: "Q4", revenueGrowthPct: 7 },
      { q: "Q5", revenueGrowthPct: 3 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 10.6, valueCY: "$288k", valuePY: "$260k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -4.8, valueCY: "74.0 days", valuePY: "77.7 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 6.9, valueCY: "$69.40", valuePY: "$64.90", trend: "up" },
    ],
  },
];

// ---- Small helpers ----
const TrendLabel: React.FC<{ pct: number; trend: "up"|"down"|"flat" }> = ({ pct, trend }) => {
  const tone = trend === "up" ? "success" : trend === "down" ? "critical" : "subdued";
  const sign = pct > 0 ? "+" : "";
  return (
    <Text as="span" tone={tone} variant="bodySm">{`${sign}${pct.toFixed(1)}% YOY`}</Text>
  );
};

const MetricBoxView: React.FC<{ m: MetricBox }> = ({ m }) => {
  const bg =
    m.key === "grossProfit" ? tint.blue :
    m.key === "timeBetweenOrders" ? tint.green :
    tint.orange;

  return (
    <Box padding="300" borderRadius="300" background="bg-fill-info">
      <BlockStack gap="100">
        <Text as="h4" variant="headingSm">{m.title}</Text>
        <Text as="p" variant="bodySm">CY: {m.valueCY}</Text>
        <Text as="p" variant="bodySm">PY: {m.valuePY}</Text>
        <TrendLabel pct={m.yoyPct} trend={m.trend} />
      </BlockStack>
    </Box>
  );
};

// Left: revenue growth by quintile (line). Swap to Bar by changing chart component below.
const QuintileGrowthChart: React.FC<{ data: QuintilePoint[] }> = ({ data }) => (
  <Box minHeight="160px">
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="q" />
        <YAxis tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Line type="monotone" dataKey="revenueGrowthPct" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </Box>
);

// ---- Card component ----
const PortfolioCard: React.FC<{ snapshot: PortfolioSnapshot }> = ({ snapshot }) => {
  const navigate = useNavigate();
  const route = `/app/portfolios/${snapshot.slug}`; // e.g., app.portfolios.growth._index.tsx

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">{snapshot.name} Portfolio</Text>

          <InlineGrid columns={["oneThird", "twoThirds"]} gap="400">
           
            <BlockStack gap="200">
              <Text as="span" variant="bodySm" tone="subdued">Revenue Growth by Quintile (YTD)</Text>
              <QuintileGrowthChart data={snapshot.quintileGrowth} />
            </BlockStack>


            <InlineGrid columns={3} gap="300">
              {snapshot.metrics.map((m) => (
                <MetricBoxView key={m.key} m={m} />
              ))}
            </InlineGrid>
          </InlineGrid>

          <Box>
            <Button onClick={() => navigate(route)} variant="primary" icon={undefined}>
              {`Explore ${snapshot.name} Portfolio →`}
            </Button>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
};

// ---- Page ----
export default function PortfoliosIndexPage() {
  // Later: replace MOCK_SNAPSHOTS with loader data scoped to shop, each with YTD stats.
  const snapshots = MOCK_SNAPSHOTS;

  return (
    <Page title="Customer Portfolio Management">
      <BlockStack gap="400">
        <Text as="p" tone="subdued">
          Explore the performance of the six customer protfolios: new, reacctivated, 
          growth, stable, declining, and defected.  Identify patterns and drill down 
          with our AI database marketing analyst.
        </Text>


        <InlineGrid columns={2} gap="400">
          {snapshots.map((snap) => (
            <PortfolioCard key={snap.slug} snapshot={snap} />
          ))}
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
*/