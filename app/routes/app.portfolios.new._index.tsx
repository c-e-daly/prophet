import * as React from "react";
import { Page, InlineGrid, BlockStack, Text } from "@shopify/polaris";
import KpiMiniBox from "../components/metrics/KPIMiniBox";
import QuintileMatrix from "../components/tables/QuintileMatrix";
import type { KpiMini, QuintileSection } from "../lib/types/portfolios";

// TODO: replace with loader + Supabase query (scoped to shop + YTD)
const KPI_LEFT: KpiMini[] = [
  { title: "Average Order Value", value: "$86.40" },
  { title: "Net Sales / Customer", value: "$212.10" },
  { title: "Average Selling Price", value: "$38.90" },
  { title: "Units / Transaction", value: "2.34" },
  { title: "Discount Rate", value: "12.7%" },
  { title: "Number of Offers", value: "1,284" },
  { title: "Offer Conversion Rate", value: "34.1%" },
  { title: "Top Category Spend", value: "Hoodies", sub: "$184k" },
];

// Right-side table (Q1..Q5 columns)
const SECTIONS: QuintileSection[] = [
  {
    id: "fin",
    heading: "Financials & Volumes",
    rows: [
      { id: "gross_sales", label: "Gross Sales", fmt: "currency", values: [480000, 320000, 210000, 120000, 60000] },
      { id: "discounts", label: "Discounts", fmt: "currency", values: [38000, 27000, 18000, 9000, 4000] },
      { id: "nor_sales", label: "NOR Sales", fmt: "currency", values: [442000, 293000, 192000, 111000, 56000] },
      { id: "returns", label: "Returns", fmt: "currency", values: [22000, 18000, 9000, 4000, 2000] },
      { id: "net_sales", label: "Net Sales", fmt: "currency", values: [420000, 275000, 183000, 107000, 54000] },
      { id: "gross_items", label: "Gross Items", fmt: "number", values: [13800, 9200, 6500, 3500, 1600] },
      { id: "net_items", label: "Net Items", fmt: "number", values: [13100, 8700, 6200, 3300, 1500] },
      { id: "gross_units", label: "Gross Units", fmt: "number", values: [15100, 10200, 7200, 3900, 1800] },
      { id: "net_units", label: "Net Units", fmt: "number", values: [14350, 9700, 6900, 3700, 1720] },
      { id: "cogs", label: "COGS", fmt: "currency", values: [210000, 142000, 95000, 53000, 27000] },
      { id: "orders", label: "Orders", fmt: "number", values: [5600, 3800, 2700, 1500, 700] },
      { id: "categories_shopped", label: "Categories Shopped", fmt: "number", values: [17, 14, 12, 9, 6] },
    ],
  },
  {
    id: "metrics",
    heading: "Behavioral & Calculated Metrics",
    rows: [
      { id: "aov", label: "Average Order Value", fmt: "currency", values: [108, 97, 85, 71, 60] },
      { id: "nor_per_cust", label: "NOR / Customer", fmt: "currency", values: [420, 275, 183, 107, 54] },
      { id: "net_per_cust", label: "Net / Customer", fmt: "currency", values: [410, 268, 178, 104, 52] },
      { id: "gp_per_cust", label: "Gross Profit / Customer", fmt: "currency", values: [240, 160, 105, 58, 28] },
      { id: "avg_selling_price", label: "Average Selling Price", fmt: "currency", values: [45, 39, 33, 29, 24] },
      { id: "avg_settle_price", label: "Average Settle Price", fmt: "currency", values: [42, 36, 31, 27, 23] },
      { id: "avg_discount_rate", label: "Average Discount Rate", fmt: "percent", values: [11.5, 12.3, 13.1, 13.8, 14.2] },
      { id: "units_per_order", label: "Units per Order", fmt: "number", values: [2.6, 2.5, 2.4, 2.3, 2.2] },
      { id: "items_per_order", label: "Items per Order", fmt: "number", values: [2.3, 2.3, 2.2, 2.1, 2.0] },
      { id: "repeat_purchase_rate", label: "Repeat Purchase Rate", fmt: "percent", values: [42.0, 37.5, 31.2, 24.9, 18.4] },
      { id: "brand_duration", label: "Brand Duration", fmt: "days", values: [210, 185, 160, 130, 95] },
      { id: "categories_per_order", label: "Categories / Order", fmt: "number", values: [1.6, 1.5, 1.4, 1.3, 1.2] },
      { id: "highest_order_value", label: "Highest Order Value", fmt: "currency", values: [890, 650, 520, 390, 260] },
      { id: "lowest_order_value", label: "Lowest Order Value", fmt: "currency", values: [22, 20, 19, 18, 17] },
      { id: "days_between_purchases", label: "Days Between Purchases", fmt: "days", values: [38, 42, 48, 55, 63] },
    ],
  },
];

export default function NewPortfolioPage() {
  return (
    <Page title="New Customer Portfolio">
      <InlineGrid columns={["oneThird", "twoThirds"]} gap="400">
        {/* LEFT: Portfolio KPIs */}
        <BlockStack gap="300">
          <Text as="h3" variant="headingMd">Portfolio KPIs (YTD)</Text>
          {/* small boxes in a 2-col grid for compactness */}
          <InlineGrid columns={2} gap="300">
            {KPI_LEFT.map((kpi) => (
              <KpiMiniBox key={kpi.title} {...kpi} />
            ))}
          </InlineGrid>
        </BlockStack>

        {/* RIGHT: Q1..Q5 table */}
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">Quintile Breakdown (Q1–Q5)</Text>
         <QuintileMatrix sections={SECTIONS} />
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}
