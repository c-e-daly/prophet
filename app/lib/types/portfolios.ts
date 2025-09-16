// Shared types so pages/components stay tiny
export type QuintilePoint = { q: "Q1"|"Q2"|"Q3"|"Q4"|"Q5"; growth: number };

export type Trend = "up" | "down" | "flat";

export type MetricBoxT = {
  key: "grossProfit" | "timeBetweenOrders" | "aov";
  title: string;
  yoyPct: number;
  valueCY: string;
  valuePY: string;
  trend: Trend;
};

export type PortfolioSnapshot = {
  name: string;
  slug: string;          // used to build /app/portfolios/:slug routes
  quintileGrowth: QuintilePoint[];
  metrics: MetricBoxT[];
};

export type PortfolioName = "new" | "reactivated" | "growth" | "stable" | "declining" | "defected";

export type KpiMini = {
  title: string;
  value: string;
  sub?: string;
};

export type QuintileColumn = "Q1" | "Q2" | "Q3" | "Q4" | "Q5";
export type TableFormat = "currency" | "number" | "percent" | "text" | "days";

export type QuintileRow = {
  id: string;
  label: string;
  fmt: TableFormat;
  values: (number | string | null)[]; // length 5 (Q1..Q5)
};

export type QuintileSection = {
  id: string;
  heading: string;
  rows: QuintileRow[];
};
