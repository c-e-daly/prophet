// app/routes/app.offers.$id.tsx
import * as React from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, InlineGrid, InlineStack, Text, Divider,
  Badge, DataTable} from "@shopify/polaris";
import { createClient } from "../utils/supabase/server";
import { formatCurrencyUSD, formatDateTime, formatPercent } from "../utils/format";
import type { Database } from "../../supabase/database.types";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type OfferRow = Tables<"offers"> & {
  carts: Tables<"carts"> | null;
  consumers: Tables<"consumers"> | null;
  campaigns: Tables<"campaigns"> | null;
  programs: Tables<"programs"> | null;
  cartitems: (Tables<"cartitems"> & {
    variants: Tables<"variants"> | null;
  })[];
};

type Consumer12M = Tables<"consumer12m">; 

type LoaderData = {
  host: string | null;
  offer: OfferRow;
  consumer12m: Consumer12M | null;
  math: {
    offerPrice: number;
    cartPrice: number;
    delta: number; // cart - offer
    unitCount: number;
    itemCount: number;
    rows: Array<{
      status: "Selling" | "Settle";
      itemLabel: string;
      sku: string | null;
      qty: number;
      sellPrice: number;
      cogs: number;
      allowance: number;
      mmuPct: number; // maintained markup %
      profit: number; // (sell - allowance - cogs)
      mmuDollars: number; // same as profit in this layout
      rowTotal: number; // sell - allowance
    }>;
    totals: {
      totalAllowance: number;
      totalMMUDollars: number;
      grossMargin: number;
      grossMarginPct: number;
      totalSettle: number; // sum of (sell - allowance)
    };
  };
};

// ---------- Loader ----------
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const offerid = Number(params.id);
  if (!offerid || Number.isNaN(offerid)) {
    throw new Response("Offer id is required", { status: 400 });
  }

  const { shopSession } = await requireCompleteShopSession(request);
  const supabase = createClient();

  const { data: offer, error } = await supabase
    .from("offers")
    .select(`
      *,
      carts (*),
      consumers (*),
      campaigns (*),
      programs (*),
      cartitems (
        *,
        variants (*)
      )
    `)
    .eq("id", id)
    .eq("shop", shopSession.shopsId)
    .single();

  if (error || !offer) {
    throw new Response(error?.message ?? "Offer not found", { status: 404 });
  }

  // 2) Pull consumer 12-month KPIs (optional)
  let consumer12m: Consumer12M | null = null;
  if (offer.consumers?.id) {
    const { data } = await supabase
      .from("consumer_12m")
      .select("*")
      .eq("consumer", offer.consumers.id)
      .eq("shop", shopSession.shopsId)
      .maybeSingle();
    consumer12m = data ?? null;
  }

  // 3) Math for the markup table
  //    We distribute (cartPrice - offerPrice) pro-rata on each line’s sellPrice.
  const offerPrice = Number(offer.offerPrice ?? 0); // you may call this price_settle or similar
  const cartPrice =
    Number(offer.carts?.cart_total ?? 0) ||
    Number(offer.carts?.subtotal ?? 0) ||
    offerPrice;

  const delta = Math.max(cartPrice - offerPrice, 0);
  const items = (offer.cartitems ?? []).filter(Boolean);

  const totalSell = items.reduce((s, it) => s + Number(it.sell_price ?? it.unit_price ?? 0) * (it.quantity ?? 1), 0);

  // Helper to safe-number
  const n = (v: any) => Number(v ?? 0);

  const rows: LoaderData["math"]["rows"] = [];
  let totalAllowance = 0;
  let totalMMUDollars = 0;
  let totalSettle = 0;

  items.forEach((it) => {
    const qty = n(it.quantity ?? 1);
    const sell = n(it.sell_price ?? it.unit_price) * qty; // line sell
    const cogs = n(it.cogs_unit) * qty;

    // Pro-rata allowance by sell contribution
    const allowance = totalSell > 0 ? (sell / totalSell) * delta : 0;
    const settle = Math.max(sell - allowance, 0);
    const profit = settle - cogs;
    const mmuPct = settle > 0 ? profit / settle : 0;

    totalAllowance += allowance;
    totalMMUDollars += profit;
    totalSettle += settle;

    const itemLabel =
      it.item_name ??
      it.item_title ??
      it.variants?.title ??
      it.variants?.name ??
      "Item";

    rows.push({
      status: "Selling",
      itemLabel,
      sku: it.sku ?? it.variants?.sku ?? null,
      qty,
      sellPrice: sell / qty,
      cogs: (cogs / qty) || 0,
      allowance: allowance / qty,
      mmuPct,
      profit: profit / qty,
      mmuDollars: profit / qty,
      rowTotal: settle / qty,
    });

    // Optional: a mirrored “Settle” row to mimic your mock (shows unit settle)
    rows.push({
      status: "Settle",
      itemLabel,
      sku: it.sku ?? it.variants?.sku ?? null,
      qty,
      sellPrice: settle / qty, // settle unit price
      cogs: (cogs / qty) || 0,
      allowance: 0, // allowance is already accounted above
      mmuPct,
      profit: profit / qty,
      mmuDollars: profit / qty,
      rowTotal: settle / qty,
    });
  });

  const itemCount = items.length;
  const unitCount = items.reduce((s, it) => s + n(it.quantity ?? 1), 0);
  const grossMargin = totalSettle - rows.reduce((s, r) => s + r.cogs * r.qty, 0);
  const grossMarginPct = totalSettle > 0 ? grossMargin / totalSettle : 0;

  return json<LoaderData>({
    host: url.searchParams.get("host"),
    offer: offer as OfferRow,
    consumer12m,
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
  });
};

// ---------- Component ----------
export default function OfferDetailPage() {
  const { offer, consumer12m, math } = useLoaderData<typeof loader>();

  const consumer = offer.consumers;
  const cart = offer.carts;
  const program = offer.programs;
  const campaign = offer.campaigns;

  // Build DataTable rows
  const tableRows = math.rows.map((r) => [
    r.status,
    r.itemLabel,
    r.sku ?? "",
    String(r.qty),
    formatCurrencyUSD(r.sellPrice),
    formatCurrencyUSD(r.cogs),
    formatCurrencyUSD(r.profit),
    formatCurrencyUSD(r.allowance),
    formatCurrencyUSD(r.rowTotal),
    formatPercent(r.mmuPct),
    formatCurrencyUSD(r.profit),
    formatCurrencyUSD(r.mmuDollars),
  ]);

  return (
    <Page
      title="Offer Details"
      subtitle={consumer?.displayName ?? consumer?.email ?? ""}
      primaryAction={
        offer.offerStatus ? (
          <Badge tone={offer.offerStatus === "Accepted" ? "success" : offer.offerStatus === "Declined" ? "critical" : "attention"}>
            {offer.offerStatus}
          </Badge>
        ) : undefined
      }
    >
      <Layout>
        {/* Top: Consumer Profile (L) + Consumer History (R) */}
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
                    <Text as="span" tone="subdued">New/Existing</Text>
                    <Text as="span">{consumer12m && (consumer12m.orders ?? 0) > 0 ? "Existing" : "New"}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  Consumer History
                </Text>
                <Divider />
                <InlineStack align="space-between">
                  <Text tone="subdued">Offers Made</Text>
                  <Text>{consumer12m?.offersMade ?? 0}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Orders Made</Text>
                  <Text>{consumer12m?.orders ?? 0}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Total Net Sales</Text>
                  <Text>{formatCurrencyUSD(consumer12m?.net_sales_12m ?? 0)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Total Units Sold</Text>
                  <Text>{consumer12m?.units_12m ?? 0}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Total Profit Markup</Text>
                  <Text>{formatCurrencyUSD(consumer12m?.mmu_dollars_12m ?? 0)}</Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Offer Summary */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                Offer Details
              </Text>
              <Divider />
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text tone="subdued">Date</Text>
                    <Text>{formatDateTime(offer.created_at ?? offer.modifiedDate ?? "")}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text tone="subdued">Offer Price</Text>
                    <Text>{formatCurrencyUSD(math.offerPrice)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text tone="subdued">Item Count</Text>
                    <Text>{math.itemCount}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text tone="subdued">Campaign</Text>
                    <Text>{campaign?.campaignName ?? "-"}</Text>
                  </InlineStack>
                </BlockStack>

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text tone="subdued">Terms</Text>
                    <Text>{offer.status ?? "—"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text tone="subdued">Cart Price</Text>
                    <Text>{formatCurrencyUSD(math.cartPrice)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text tone="subdued">Unit Count</Text>
                    <Text>{math.unitCount}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text tone="subdued">Program</Text>
                    <Text>{program?.programName ?? "-"}</Text>
                  </InlineStack>
                </BlockStack>
              </InlineGrid>

              <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                <InlineStack align="space-between">
                  <Text tone="subdued">Delta</Text>
                  <Text>{formatCurrencyUSD(math.delta)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Accept Rate</Text>
                  <Text>
                    {program?.acceptRate != null ? formatPercent(Number(program.acceptRate) / 100) : "—"}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Cart ID</Text>
                  <Text>{cart?.id ?? "-"}</Text>
                </InlineStack>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Items + Markup */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                Item Details
              </Text>
              <Divider />
              <DataTable
                columnContentTypes={[
                  "text", // STATUS
                  "text", // ITEM
                  "text", // SKU
                  "numeric", // QTY
                  "numeric", // SELL PRICE
                  "numeric", // COGS
                  "numeric", // PROFIT
                  "numeric", // ALLOWANCES
                  "numeric", // TOTAL (settle)
                  "numeric", // MMU %
                  "numeric", // PROFIT (again, per mock)
                  "numeric", // MMU Dollars
                ]}
                headings={[
                  "STATUS",
                  "ITEM (VARIANT)",
                  "SKU",
                  "QTY",
                  "SELL PRICE",
                  "COGS",
                  "PROFIT",
                  "ALLOWANCES",
                  "TOTAL",
                  "MMU %",
                  "PROFIT",
                  "MMU Dollars",
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

              <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                <InlineStack align="space-between">
                  <Text tone="subdued">Settle Total</Text>
                  <Text>{formatCurrencyUSD(math.totals.totalSettle)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Gross Margin</Text>
                  <Text>{formatCurrencyUSD(math.totals.grossMargin)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text tone="subdued">Gross Margin %</Text>
                  <Text>{formatPercent(math.totals.grossMarginPct)}</Text>
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
    <Page title="Offer Details">
      <Card>
        <Text variant="headingMd" as="h2">Something went wrong</Text>
        <Text tone="critical" as="p">{error?.message ?? "Unexpected error"}</Text>
      </Card>
    </Page>
  );
}
