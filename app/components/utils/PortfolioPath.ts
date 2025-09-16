import { PORTFOLIO_IDS, type PortfolioId } from "../../lib/types/portfolios";

/** Pulls the portfolio id from the URL path, e.g. /app/portfolios/new -> "new" */
export function getPortfolioIdFromRequest(request: Request): PortfolioId {
  const path = new URL(request.url).pathname;
  const parts = path.split("/").filter(Boolean);
  // Prefer the segment right after "portfolios"
  const idx = parts.lastIndexOf("portfolios");
  const candidate = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : parts[parts.length - 1];

  if ((PORTFOLIO_IDS as readonly string[]).includes(candidate)) {
    return candidate as PortfolioId;
  }

  // If you want a softer failure, return a default or throw a 404
  throw new Response(`Unknown portfolio: ${candidate}`, { status: 404 });
}
