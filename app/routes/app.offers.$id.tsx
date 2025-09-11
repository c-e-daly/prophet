// app/routes/app.offers.$id.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import {
  Page, Layout, Card, BlockStack, InlineGrid, InlineStack, Text, Divider,
  Badge, DataTable
} from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime, formatPercent } from "../utils/format";
import type { Database } from "../../supabase/database.types";
import { requireShopSession } from "../lib/session/shopAuth.server";
import { getShopSingleOffer } from "../lib/queries/supabase/getShopSingleOffer";

// Type definitions
type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type OfferRow = Tables<"offers"> & {
  carts: Tables<"carts"> | null;
  consumers: Tables<"consumers"> | null;
  campaigns: Tables<"campaigns"> | null;
  programs: Tables<"programs"> | null;
  consumerShop12m: Tables<"consumerShop12m"> | null;
  cartitems: (Tables<"cartitems"> & {
    variants: Tables<"variants"> | null;
  })[];
};


type ItemRow = {
  status: "Selling" | "Settle";
  itemLabel: string;
  sku: string | null;
  qty: number;
  sellPrice: number;
  cogs: number;
  allowance: number;
  mmuPct: number;
  profit: number;
  mmuDollars: number;
  rowTotal: number;
};

type LoaderData = {
  offersID: number;
  host: string | null;
  offers: OfferRow;
  consumerShop12m: consumerShop12m | null;
  math: {
    offerPrice: number;
    cartPrice: number;
    delta: number;
    unitCount: number;
    itemCount: number;
    rows: ItemRow[];
    totals: {
      totalAllowance: number;
      totalMMUDollars: number;
      grossMargin: number;
      grossMarginPct: number;
      totalSettle: number;
    };
  };
  session: {
    shopDomain: string;
    shopsBrandName?: string;
    shopsID: number;
  };
};

// ---------- Loader ----------
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Get authenticated session
  const { shopSession } = await requireShopSession(request);

  const url = new URL(request.url);
  const offersID = Number(params.id);

  if (!offersID || Number.isNaN(offersID)) {
    throw new Response("Offer ID is required", { status: 400 });
  }

  // Get offer data using your query function
  const { offers, consumerShop12m } = await getShopSingleOffer({
    request,
    shopsID: shopSession.shopsID,
    offersID
  });

  if (!offers) {
    throw new Response("Offer not found", { status: 404 });
  }

  // Calculate pricing math
  const offerPrice = Number(offers.offerPrice ?? 0);
  const cartPrice = Number(offers.carts?.cart_total ?? offers.carts?.subtotal ?? offerPrice);
  const delta = Math.max(cartPrice - offerPrice, 0);
  const items = (offers.cartitems ?? []).filter(Boolean);

  // Calculate totals for pro-rata allocation
  const totalSell = items.reduce((sum, item) =>
    sum + Number(item.sell_price ?? item.unit_price ?? 0) * Number(item.quantity ?? 1), 0
  );

  // Helper to safely convert to number
  const safeNumber = (value: any): number => Number(value ?? 0);

  // Process items into rows
  const rows: ItemRow[] = [];
  let totalAllowance = 0;
  let totalMMUDollars = 0;
  let totalSettle = 0;

  items.forEach((item) => {
    const qty = safeNumber(item.quantity ?? 1);
    const unitPrice = safeNumber(item.sell_price ?? item.unit_price);
    const sell = unitPrice * qty;
    const cogs = safeNumber(item.cogs_unit) * qty;

    // Pro-rata allowance allocation based on sell contribution
    const allowance = totalSell > 0 ? (sell / totalSell) * delta : 0;
    const settle = Math.max(sell - allowance, 0);
    const profit = settle - cogs;
    const mmuPct = settle > 0 ? profit / settle : 0;

    // Accumulate totals
    totalAllowance += allowance;
    totalMMUDollars += profit;
    totalSettle += settle;

    const itemLabel = item.item_name ??
      item.item_title ??
      item.variants?.title ??
      item.variants?.name ??
      "Unknown Item";

    const sku = item.sku ?? item.variants?.sku ?? null;

    // Add selling row
    rows.push({
      status: "Selling",
      itemLabel,
      sku,
      qty,
      sellPrice: unitPrice,
      cogs: safeNumber(item.cogs_unit),
      allowance: allowance / qty,
      mmuPct,
      profit: profit / qty,
      mmuDollars: profit / qty,
      rowTotal: sell / qty,
    });

    // Add settle row
    rows.push({
      status: "Settle",
      itemLabel,
      sku,
      qty,
      sellPrice: settle / qty,
      cogs: safeNumber(item.cogs_unit),
      allowance: 0, // Already accounted for in selling row
      mmuPct,
      profit: profit / qty,
      mmuDollars: profit / qty,
      rowTotal: settle / qty,
    });
  });

  const itemCount = items.length;
  const unitCount = items.reduce((sum, item) => sum + safeNumber(item.quantity ?? 1), 0);
  const totalCogs = rows.reduce((sum, row) => sum + (row.cogs * row.qty), 0) / 2; // Divide by 2 because we have duplicate rows
  const grossMargin = totalSettle - totalCogs;
  const grossMarginPct = totalSettle > 0 ? grossMargin / totalSettle : 0;

  return json<LoaderData>({
    offersID,
    host: url.searchParams.get("host"),
    offers: offers as OfferRow,
    consumerShop12m,
    math: {
      offerPrice,
      cartPrice,
      delta,
      unitCount,
      itemCount,
      rows,
      totals: {
        totalAllowance,
        totalMMUDollars,
        grossMargin,
        grossMarginPct,
        totalSettle,
      },
    },
    session: {
      shopDomain: shopSession.shopDomain,
      shopsBrandName: shopSession.shopsBrandName,
      shopsID: shopSession.shopsID,
    }
  });
};

// ---------- Component ----------
export default function OfferDetailPage() {
  const { offers, consumerShop12m, math, session } = useLoaderData<typeof loader>();

  const consumer = offers.consumers;
  const cart = offers.carts;
  const program = offers.programs;
  const campaign = offers.campaigns;


  // Build DataTable rows
  const tableRows = math.rows.map((row) => [
    row.status,
    row.itemLabel,
    row.sku ?? "",
    String(row.qty),
    formatCurrencyUSD(row.sellPrice),
    formatCurrencyUSD(row.cogs),
    formatCurrencyUSD(row.profit),
    formatCurrencyUSD(row.allowance),
    formatCurrencyUSD(row.rowTotal),
    formatPercent(row.mmuPct),
    formatCurrencyUSD(row.profit), // Duplicate column as per your design
    formatCurrencyUSD(row.mmuDollars),
  ]);

  return (
    <Page
      title="Offer Details"
      subtitle={consumer?.displayName ?? consumer?.email ?? ""}
      primaryAction={
        offers.offerStatus ? (
          <Badge
            tone={
              offers.offerStatus === "Auto Accepted" ? "success" :
                offers.offerStatus === "Auto Declined" ? "critical" :
                  "attention"
            }
          >
            {offers.offerStatus}
          </Badge>
        ) : undefined
      }
    >
      <Layout>
        {/* Consumer Profile & History */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  Consumer Profile
                </Text>
                <Divider />
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Name</Text>
                    <Text as="span">{consumer?.displayName ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Email</Text>
                    <Text as="span">{consumer?.email ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Phone</Text>
                    <Text as="span">{consumer?.phone ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Shopify GID</Text>
                    <Text as="span" truncate>
                      {consumer?.customerGID ?? "-"}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Customer Type</Text>
                    <Text as="span">
                      {consumerShop12m && (consumerShop12m.orders ?? 0) > 0 ? "Existing" : "New"}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  Consumer History (12M)
                </Text>
                <Divider />
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Offers Made</Text>
                    <Text as="span">{consumerShop12m?.offersMade ?? 0}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Orders</Text>
                    <Text as="span">{consumerShop12m?.orders ?? 0}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Net Sales</Text>
                    <Text as="span">{formatCurrencyUSD(consumerShop12m?.net_sales_12m ?? 0)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Units Sold</Text>
                    <Text as="span">{consumerShop12m?.units_12m ?? 0}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">MMU Dollars</Text>
                    <Text as="span">{formatCurrencyUSD(consumerShop12m?.mmu_dollars_12m ?? 0)}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Offer Summary */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                Offer Summary
              </Text>
              <Divider />
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Date</Text>
                    <Text as="span">{formatDateTime(offers.created_at ?? offers.modifiedDate ?? "")}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Offer Price</Text>
                    <Text as="span">{formatCurrencyUSD(math.offerPrice)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Cart Price</Text>
                    <Text as="span">{formatCurrencyUSD(math.cartPrice)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Delta</Text>
                    <Text as="span" tone={math.delta > 0 ? "critical" : "subdued"}>
                      {formatCurrencyUSD(math.delta)}
                    </Text>
                  </InlineStack>
                </BlockStack>

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Item Count</Text>
                    <Text as="span">{math.itemCount}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Unit Count</Text>
                    <Text as="span">{math.unitCount}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Campaign</Text>
                    <Text as="span">{campaign?.campaignName ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Program</Text>
                    <Text as="span">{program?.programName ?? "-"}</Text>
                  </InlineStack>
                </BlockStack>
              </InlineGrid>

              {program?.acceptRate != null && (
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd" tone="subdued">Accept Rate</Text>
                  <Text as="span" variant="bodyMd">{formatPercent(Number(program.acceptRate) / 100)}</Text>
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Item Details Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                Item Breakdown
              </Text>
              <Divider />
              <DataTable
                columnContentTypes={[
                  "text",    // STATUS
                  "text",    // ITEM
                  "text",    // SKU
                  "numeric", // QTY
                  "numeric", // SELL PRICE
                  "numeric", // COGS
                  "numeric", // PROFIT
                  "numeric", // ALLOWANCES
                  "numeric", // TOTAL
                  "numeric", // MMU %
                  "numeric", // PROFIT (duplicate)
                  "numeric", // MMU Dollars
                ]}
                headings={[
                  "Status",
                  "Item (Variant)",
                  "SKU",
                  "Qty",
                  "Sell Price",
                  "COGS",
                  "Profit",
                  "Allowances",
                  "Total",
                  "MMU %",
                  "Profit",
                  "MMU $",
                ]}
                rows={tableRows}
                totals={[
                  "", "", "", "",
                  "", "",
                  formatCurrencyUSD(math.totals.totalMMUDollars),
                  formatCurrencyUSD(math.totals.totalAllowance),
                  formatCurrencyUSD(math.totals.totalSettle),
                  formatPercent(math.totals.grossMarginPct),
                  formatCurrencyUSD(math.totals.grossMargin),
                  formatCurrencyUSD(math.totals.totalMMUDollars),
                ]}
                stickyHeader
              />

              {/* Summary totals */}
              <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Settle Total</Text>
                  <Text as="span">{formatCurrencyUSD(math.totals.totalSettle)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Gross Margin</Text>
                  <Text as="span">{formatCurrencyUSD(math.totals.grossMargin)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Margin %</Text>
                  <Text as="span">{formatPercent(math.totals.grossMarginPct)}</Text>
                </InlineStack>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// ---------- Error Boundary ----------
export function ErrorBoundary() {
  const error = useRouteError() as any;
  return (
    <Page title="Offer Details - Error">
      <Card>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h2">Something went wrong</Text>
          <Text tone="critical" as="p">
            {error?.message ?? "An unexpected error occurred while loading the offer details."}
          </Text>
          {error?.status && (
            <Text tone="subdued" as="p">Error {error.status}</Text>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}