// app/lib/types/portfolios.ts

export type PortfolioId = "new" | "reactivated" | "stable" | "growth" | "declining" | "defected";

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