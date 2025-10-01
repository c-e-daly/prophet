// app/lib/types/portfolios.ts

export type PortfolioId = "new" | "reactivated" | "stable" | "growth" | "declining" | "defected";

export const PORTFOLIO_IDS: PortfolioId[] = [
  "new",
  "reactivated", 
  "stable",
  "growth",
  "declining",
  "defected"
];

export const PORTFOLIO_LABELS: Record<PortfolioId, string> = {
  new: "New",
  reactivated: "Reactivated",
  stable: "Stable",
  growth: "Growth",
  declining: "Declining",
  defected: "Defected",
};

export const PORTFOLIO_DESCRIPTIONS: Record<PortfolioId, string> = {
  new: "First-time customers",
  reactivated: "Recently returned after period of inactivity",
  stable: "Consistent purchase patterns",
  growth: "Increasing spend over time",
  declining: "Decreasing engagement and spend",
  defected: "No purchases in extended period",
};

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