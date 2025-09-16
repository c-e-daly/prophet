import * as React from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, InlineGrid, BlockStack, Text, Link as PolarisLink} from "@shopify/polaris";
import KpiMiniBox from "../components/metrics/KPIMiniBox";
import QuintileMatrix from "../components/tables/QuintileMatrix";
import type { KpiMini, QuintileSection } from "../lib/types/portfolios";
import { PORTFOLIO_IDS, type PortfolioId } from "../lib/types/portfolios";
import { authenticate } from "../shopify.server";


export async function loader({ params, request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const portfolio: PortfolioId = "new";
  
  // Mock KPI panel (left)
  const kpis: KpiMini[] = [
    { title: "Average Order Value", value: "$86.40" },
    { title: "Net Sales / Customer", value: "$212.10" },
    { title: "Average Selling Price", value: "$38.90" },
    { title: "Units / Transaction", value: "2.34" },
    { title: "Discount Rate", value: "12.7%" },
    { title: "Number of Offers", value: "1,284" },
    { title: "Offer Conversion Rate", value: "34.1%" },
    { title: "Top Category Spend", value: "Hoodies", sub: "$184k" },
  ];

  // Mock sections (right) with your two extra rows
  const sections: QuintileSection[] = [
    {
      id: "fin",
      heading: "Financials & Volumes",
      rows: [
        { id: "consumers", label: "Consumers", fmt: "number",
          desc: "Number of unique customers in each quintile.",
          values: [2100, 2100, 2100, 2100, 2100] },

        { id: "gross_sales", label: "Gross Sales", fmt: "currency",
          desc: "Sum of item prices before discounts/returns.",
          values: [480000, 320000, 210000, 120000, 60000] },

        { id: "discounts", label: "Discounts", fmt: "currency",
          desc: "Gross discounts at time of purchase (excludes return adjustments).",
          values: [38000, 27000, 18000, 9000, 4000] },

        { id: "nor_sales", label: "NOR Sales", fmt: "currency",
          desc: "Net of returns: Gross Sales minus Gross Discounts (marketing effectiveness).",
          values: [442000, 293000, 192000, 111000, 56000] },

        { id: "returns", label: "Returns", fmt: "currency",
          desc: "Refund value including proportional discount on returned units.",
          values: [22000, 18000, 9000, 4000, 2000] },

        { id: "net_sales", label: "Net Sales", fmt: "currency",
          desc: "NOR Sales minus Returns.",
          values: [420000, 275000, 183000, 107000, 54000] },

        { id: "gross_items", label: "Gross Items", fmt: "number",
          desc: "Count of items before returns.",
          values: [13800, 9200, 6500, 3500, 1600] },

        { id: "net_items", label: "Net Items", fmt: "number",
          desc: "Gross Items minus returned items.",
          values: [13100, 8700, 6200, 3300, 1500] },

        { id: "gross_units", label: "Gross Units", fmt: "number",
          desc: "Units purchased before returns (often equals Gross Items).",
          values: [15100, 10200, 7200, 3900, 1800] },

        { id: "net_units", label: "Net Units", fmt: "number",
          desc: "Gross Units minus returned units.",
          values: [14350, 9700, 6900, 3700, 1720] },

        { id: "cogs", label: "COGS", fmt: "currency",
          desc: "Cost of goods sold for net items.",
          values: [210000, 142000, 95000, 53000, 27000] },

        { id: "orders", label: "Orders", fmt: "number",
          desc: "Number of placed orders (pre-cancel).",
          values: [5600, 3800, 2700, 1500, 700] },

        { id: "categories_shopped", label: "Categories Shopped", fmt: "number",
          desc: "Distinct categories purchased by each quintile.",
          values: [17, 14, 12, 9, 6] },
      ],
    },
    {
      id: "metrics",
      heading: "Behavioral & Calculated Metrics",
      rows: [
        { id: "aov", label: "Average Order Value", fmt: "currency",
          desc: "Net Sales ÷ Orders.",
          values: [108, 97, 85, 71, 60] },

        { id: "orders_per_customer", label: "Orders / Customer", fmt: "number",
          desc: "Orders ÷ Consumers.",
          values: [2.7, 2.2, 1.8, 1.4, 1.1] },

        { id: "nor_per_cust", label: "NOR / Customer", fmt: "currency",
          desc: "NOR Sales ÷ Consumers.",
          values: [420, 275, 183, 107, 54] },

        { id: "net_per_cust", label: "Net / Customer", fmt: "currency",
          desc: "Net Sales ÷ Consumers.",
          values: [410, 268, 178, 104, 52] },

        { id: "gp_per_cust", label: "Gross Profit / Customer", fmt: "currency",
          desc: "(Net Sales − COGS) ÷ Consumers.",
          values: [240, 160, 105, 58, 28] },

        { id: "avg_selling_price", label: "Average Selling Price", fmt: "currency",
          desc: "Net Item revenue ÷ Net Items.",
          values: [45, 39, 33, 29, 24] },

        { id: "avg_settle_price", label: "Average Settle Price", fmt: "currency",
          desc: "Final price paid per item after discounts/returns.",
          values: [42, 36, 31, 27, 23] },

        { id: "avg_discount_rate", label: "Average Discount Rate", fmt: "percent",
          desc: "Gross Discounts ÷ Gross Sales.",
          values: [11.5, 12.3, 13.1, 13.8, 14.2] },

        { id: "units_per_order", label: "Units per Order", fmt: "number",
          desc: "Net Units ÷ Orders.",
          values: [2.6, 2.5, 2.4, 2.3, 2.2] },

        { id: "items_per_order", label: "Items per Order", fmt: "number",
          desc: "Net Items ÷ Orders.",
          values: [2.3, 2.3, 2.2, 2.1, 2.0] },

        { id: "repeat_purchase_rate", label: "Repeat Purchase Rate", fmt: "percent",
          desc: "Share of consumers with >1 order in period.",
          values: [42.0, 37.5, 31.2, 24.9, 18.4] },

        { id: "brand_duration", label: "Brand Duration", fmt: "days",
          desc: "Avg. days between first and last purchase (YTD).",
          values: [210, 185, 160, 130, 95] },

        { id: "categories_per_order", label: "Categories / Order", fmt: "number",
          desc: "Distinct categories per order, averaged.",
          values: [1.6, 1.5, 1.4, 1.3, 1.2] },

        { id: "highest_order_value", label: "Highest Order Value", fmt: "currency",
          desc: "Max order value per quintile.",
          values: [890, 650, 520, 390, 260] },

        { id: "lowest_order_value", label: "Lowest Order Value", fmt: "currency",
          desc: "Min order value per quintile.",
          values: [22, 20, 19, 18, 17] },

        { id: "days_between_purchases", label: "Days Between Purchases", fmt: "days",
          desc: "Avg. days between consecutive orders.",
          values: [38, 42, 48, 55, 63] },
      ],
    },
  ];

  return json({ portfolio, kpis, sections });
}

export default function PortfolioPage() {
  const { portfolio, kpis, sections } =
    useLoaderData<typeof loader>();

  const title = `${portfolio[0].toUpperCase()}${portfolio.slice(1)} Portfolio`;

  return (
    <Page title={title} subtitle="First purchase in trailing 12 months; quintiles ranked by sales volume (Q1 highest)">
      <InlineGrid columns={["oneThird", "twoThirds"]} gap="400">
        {/* LEFT: KPIs */}
        <BlockStack gap="300">
          <Text as="h3" variant="headingMd">Portfolio KPIs (YTD)</Text>
          <InlineGrid columns={2} gap="300">
            {kpis.map((k) => <KpiMiniBox key={k.title} {...k} />)}
          </InlineGrid>

          {/* link to your how-to page */}
          <Text as="p" variant="bodySm">
            <PolarisLink url="/app/portfolios/guide">
              How to use Customer Portfolio Management →
            </PolarisLink>
          </Text>            
         </BlockStack>
        {/* RIGHT: Quintile table */}
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">Quintile Breakdown (Q1–Q5)</Text>
          <QuintileMatrix sections={sections} />
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}
