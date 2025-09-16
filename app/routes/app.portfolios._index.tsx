// app/routes/app.portfolios._index.tsx
import * as React from "react";
import { Page, Card, Text, Box, InlineGrid, BlockStack, Link as PolarisLink } from "@shopify/polaris";
import QuintileGrowthPie from "../components/charts/QuintilePieChart";

// ---------- Types ----------
type QuintilePoint = { q: "Q1" | "Q2" | "Q3" | "Q4" | "Q5"; growth: number };
type MetricBox = {
  key: "grossProfit" | "timeBetweenOrders" | "aov";
  title: string;
  yoyPct: number;
  valueCY: string;
  valuePY: string;
  trend: "up" | "down" | "flat";
};
type PortfolioSnapshot = {
  name: string; // display
  slug: "new" | "growth" | "stable" | "reactivated" | "declining" | "defected"; // route segment
  quintileGrowth: QuintilePoint[]; // growth in $ by quintile
  metrics: MetricBox[];
};

// ---------- Example data (swap with loader later) ----------
const MOCK_SNAPSHOTS: PortfolioSnapshot[] = [
  {
    name: "New",
    slug: "new",
    quintileGrowth: [
      { q: "Q1", growth: 250 },
      { q: "Q2", growth: 120 },
      { q: "Q3", growth: 60 },
      { q: "Q4", growth: 20 },
      { q: "Q5", growth: -10 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 12.4, valueCY: "$1.28M", valuePY: "$1.14M", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -6.1, valueCY: "41.8 days", valuePY: "44.6 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 5.7, valueCY: "$86.40", valuePY: "$81.75", trend: "up" },
    ],
  },
  {
    name: "Growth",
    slug: "growth",
    quintileGrowth: [
      { q: "Q1", growth: 180 },
      { q: "Q2", growth: 110 },
      { q: "Q3", growth: 70 },
      { q: "Q4", growth: 35 },
      { q: "Q5", growth: 12 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 7.9, valueCY: "$964k", valuePY: "$893k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -2.2, valueCY: "48.9 days", valuePY: "50.0 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 2.3, valueCY: "$63.10", valuePY: "$61.70", trend: "up" },
    ],
  },
  {
    name: "Stable",
    slug: "stable",
    quintileGrowth: [
      { q: "Q1", growth: 90 },
      { q: "Q2", growth: 60 },
      { q: "Q3", growth: 40 },
      { q: "Q4", growth: 20 },
      { q: "Q5", growth: 8 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 18.2, valueCY: "$402k", valuePY: "$340k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -9.3, valueCY: "61.4 days", valuePY: "67.7 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 4.2, valueCY: "$54.00", valuePY: "$51.80", trend: "up" },
    ],
  },
  {
    name: "Reactivated", // fixed spelling
    slug: "reactivated",
    quintileGrowth: [
      { q: "Q1", growth: 75 },
      { q: "Q2", growth: 55 },
      { q: "Q3", growth: 30 },
      { q: "Q4", growth: 15 },
      { q: "Q5", growth: 6 },
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
      { q: "Q1", growth: -20 },
      { q: "Q2", growth: -35 },
      { q: "Q3", growth: -50 },
      { q: "Q4", growth: -65 },
      { q: "Q5", growth: -80 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: -8.9, valueCY: "$611k", valuePY: "$671k", trend: "down" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: 7.5, valueCY: "59.8 days", valuePY: "55.6 days", trend: "up" },
      { key: "aov", title: "AOV", yoyPct: -3.7, valueCY: "$61.70", valuePY: "$64.00", trend: "down" },
    ],
  },
  {
    name: "Defected",
    slug: "defected",
    quintileGrowth: [
      { q: "Q1", growth: -60 },
      { q: "Q2", growth: -40 },
      { q: "Q3", growth: -25 },
      { q: "Q4", growth: -10 },
      { q: "Q5", growth: -5 },
    ],
    metrics: [
      { key: "grossProfit", title: "Gross Profit", yoyPct: 10.6, valueCY: "$288k", valuePY: "$260k", trend: "up" },
      { key: "timeBetweenOrders", title: "Time Between Orders", yoyPct: -4.8, valueCY: "74.0 days", valuePY: "77.7 days", trend: "down" },
      { key: "aov", title: "AOV", yoyPct: 6.9, valueCY: "$69.40", valuePY: "$64.90", trend: "up" },
    ],
  },
];

// enforce display order
const PORTFOLIO_ORDER: PortfolioSnapshot["slug"][] = ["new", "growth", "stable", "reactivated", "declining", "defected"];
const snapshotsOrdered = [...MOCK_SNAPSHOTS].sort(
  (a, b) => PORTFOLIO_ORDER.indexOf(a.slug) - PORTFOLIO_ORDER.indexOf(b.slug)
);

// ---------- UI bits ----------
const TrendLabel: React.FC<{ pct: number; trend: "up" | "down" | "flat" }> = ({ pct, trend }) => {
  const tone = trend === "up" ? "success" : trend === "down" ? "critical" : "subdued";
  const sign = pct > 0 ? "+" : "";
  return <Text as="span" tone={tone} variant="bodySm">{`${sign}${pct.toFixed(1)}% YOY`}</Text>;
};

const MetricBoxView: React.FC<{ m: MetricBox }> = ({ m }) => (
  <Box padding="300" borderRadius="300" background={"bg-fill-secondary"}>
    <BlockStack gap="100">
      <Text as="h4" variant="headingSm">{m.title}</Text>
      <Text as="p" variant="bodySm">CY: {m.valueCY}</Text>
      <Text as="p" variant="bodySm">PY: {m.valuePY}</Text>
      <TrendLabel pct={m.yoyPct} trend={m.trend} />
    </BlockStack>
  </Box>
);

const PortfolioCard: React.FC<{ snapshot: PortfolioSnapshot }> = ({ snapshot }) => {
  const route = `/app/portfolios/${snapshot.slug}`;
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">{snapshot.name} Portfolio</Text>

          <InlineGrid columns={2} gap="400">
            {/* Left: pie (growth by quintile) */}
            <BlockStack gap="200">
              <QuintileGrowthPie
                data={snapshot.quintileGrowth}
                title="Share of Net Growth by Quintile (YTD)"
              />
            </BlockStack>

            {/* Right: stacked KPI boxes */}
            <BlockStack gap="300">
              {snapshot.metrics.map((m) => (
                <MetricBoxView key={m.key} m={m} />
              ))}
            </BlockStack>
          </InlineGrid>

          {/* Plain text link CTA */}
          <PolarisLink url={route}>{`Explore ${snapshot.name} Portfolio →`}</PolarisLink>
        </BlockStack>
      </Box>
    </Card>
  );
};

// ---------- Page ----------
export default function PortfoliosIndexPage() {
  return (
    <Page title="Customer Portfolio Management">
      <BlockStack gap="400">
        <Text as="p" tone="subdued">
          Customer Portfolio Management provides insights on brand growth across six portfolios:
          New, Growth, Stable, Reactivated, Declining, Defected. Beyond cohorts, portfolios evaluate overall brand health.
        </Text>

        <InlineGrid columns={2} gap="400">
          {snapshotsOrdered.map((snap) => (
            <PortfolioCard key={snap.slug} snapshot={snap} />
          ))}
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
