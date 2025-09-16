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
