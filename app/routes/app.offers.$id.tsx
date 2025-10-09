// app/routes/app.offers.$id.tsx
// app/routes/app.offers.$id.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getShopSingleOffer, type SingleOfferPayload } from "../lib/queries/supabase/getShopSingleOffer";
import type { CounterOfferRow, ConsumerRow } from "../lib/types/dbTables";
import { useLoaderData, useRouteError, useNavigate, Link } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, InlineGrid, InlineStack, Text, Divider,
  Badge, DataTable, Button, ButtonGroup } from "@shopify/polaris";
import { formatCurrencyUSD, formatUSD, formatDateTime, formatPercent } from "../utils/format";

type LoaderData = {
  offersID: number;
  payload: SingleOfferPayload;
  math: {
    offerPrice: number;
    cartPrice: number;
    delta: number;
    unitCount: number;
    itemCount: number;
    totals: {
      totalAllowance: number;
      totalMMUDollars: number;
      grossMargin: number;
      grossMarginPct: number;
      totalSettle: number;
    };
    rows: Array<{
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
    }>;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const offersID = Number(params.id);
  
  if (!Number.isFinite(offersID)) {
    throw new Response("Invalid Offer id", { status: 400 });
  }
  
  const payload = await getShopSingleOffer(shopsID, offersID);
  
  if (!payload) {
    throw new Response("Offer not found", { status: 404 });
  }

  // Calculate pricing math
  const offerPrice = Number(payload.offer.offerPrice ?? 0);
  const cartPrice = Number(
    payload.cart?.cartTotalPrice ?? payload.cart?.cartItemsSubtotal ?? 0
  );
  const delta = Math.max(cartPrice - offerPrice, 0);
  
  const items = payload.cartItems ?? [];
  const n = (v: any) => Number(v ?? 0);

  const totalSell = items.reduce((s, item) => 
    s + n(item.cartItem.unitPrice) * n(item.cartItem.units), 0
  );
  
  let totalAllowance = 0;
  let totalMMUDollars = 0;
  let totalSettle = 0;
  const rows: LoaderData["math"]["rows"] = [];

  items.forEach((item) => {
    const qty = n(item.cartItem.units);
    const unitPrice = n(item.cartItem.unitPrice);
    const unitCost = n(item.variantPricing?.itemCost);
    const lineTotalPrice = unitPrice * qty;
    const lineTotalCost = unitCost * qty;

    const allowance = totalSell > 0 ? (lineTotalPrice / totalSell) * delta : 0;
    const lineSettle = Math.max(lineTotalPrice - allowance, 0);
    const itemSettlePrice = lineSettle / qty;

    const lineProfit = lineSettle - lineTotalCost;
    const unitProfit = lineProfit / qty;
    const mmuPct = lineSettle > 0 ? lineProfit / lineSettle : 0;

    totalAllowance += allowance;
    totalMMUDollars += lineProfit;
    totalSettle += lineSettle;

    const label = item.cartItem.name ?? 
                  item.cartItem.productName ?? 
                  `Product ${item.cartItem.productID?.split('/').pop() ?? 'Unknown'}`;
    const sku = item.cartItem.sku ?? null;

    // Selling row
    rows.push({
      status: "Selling",
      itemLabel: label,
      sku,
      qty,
      sellPrice: unitPrice,
      cogs: unitCost,
      allowance: allowance / qty,
      mmuPct: unitPrice > 0 ? (unitPrice - unitCost) / unitPrice : 0,
      profit: unitPrice - unitCost,
      mmuDollars: unitPrice - unitCost,
      rowTotal: unitPrice,
    });

    // Settle row
    rows.push({
      status: "Settle",
      itemLabel: label,
      sku,
      qty,
      sellPrice: itemSettlePrice,
      cogs: unitCost,
      allowance: 0,
      mmuPct,
      profit: unitProfit,
      mmuDollars: unitProfit,
      rowTotal: itemSettlePrice,
    });
  });

  const totalCogs = items.reduce((s, item) => 
    s + n(item.variantPricing?.itemCost) * n(item.cartItem.units), 0
  );
  const grossMargin = totalSettle - totalCogs;
  const grossMarginPct = totalSettle > 0 ? grossMargin / totalSettle : 0;

  return json<LoaderData>({
    offersID,
    payload,
    math: {
      offerPrice,
      cartPrice,
      delta,
      unitCount: items.reduce((s, item) => s + n(item.cartItem.units), 0),
      itemCount: items.length,
      totals: {
        totalAllowance,
        totalMMUDollars,
        grossMargin,
        grossMarginPct,
        totalSettle,
      },
      rows,
    },
  });
};

// ---------- Component ----------
export default function OfferDetailPage() {
  const { payload, math, offersID } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const offer = payload.offer;
  const consumer = payload.consumer;
  const consumerShop12m = payload.consumerShop12M;
  const cart = payload.cart;
  const program = payload.program;
  const campaign = payload.campaign;
  const counterOffers = payload.counterOffers ?? [];
  
  const isPending = offer.offerStatus === "Pending Review";

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
    formatCurrencyUSD(row.profit),
    formatCurrencyUSD(row.mmuDollars),
  ]);

  // Counter offers table rows
const counterRows = counterOffers.map((co: CounterOfferRow) => [
  <Link key={co.id} to={`/app/offers/counter/${co.id}`}>#{co.id}</Link>,
  <Badge key={`badge-${co.id}`} tone={getCounterStatusTone(co.offerStatus)}>
    {co.offerStatus || "Draft"}
  </Badge>,
  co.counterType || "—",
  formatCurrencyUSD(co.finalAmountCents ?? 0),
  formatCurrencyUSD(co.totalDiscountCents ?? 0),
  formatPercent((co.predictedAcceptanceProbability || 0) / 100),
  formatDateTime(co.createDate ?? ""),
]);
  
  return (
    <Page
      title="Offer Details"
      subtitle={consumer?.displayName ?? consumer?.email ?? ""}
      backAction={{ content: "Offers", url: "/app/offers" }}
      primaryAction={
        offer.offerStatus ? (
          <Badge
            tone={
              offer.offerStatus === "Auto Accepted" || 
              offer.offerStatus === "Consumer Accepted" ? "success" :
              offer.offerStatus === "Auto Declined" ||
              offer.offerStatus === "Consumer Declined" ? "critical" :
              "attention"
            }
          >
            {offer.offerStatus}
          </Badge>
        ) : undefined
      }
    >
      <Layout>
        {/* Action Buttons - Only for Pending offers */}
        {isPending && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">Actions</Text>
                <Divider />
                <ButtonGroup>
                  <Button
                    variant="primary"
                    tone="success"
                    onClick={() => {
                      console.log('Accept offer:', offersID);
                      alert('Accept functionality coming soon!');
                    }}
                  >
                    Accept Offer
                  </Button>
                  <Button onClick={() => navigate(`/app/offers/counter/new?offersID=${offersID}`)}>
                    Create Counter Offer
                  </Button>
                  <Button
                    tone="critical"
                    onClick={() => {
                      console.log('Decline offer:', offersID);
                      alert('Decline functionality coming soon!');
                    }}
                  >
                    Decline Offer
                  </Button>
                </ButtonGroup>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Consumer Profile & History */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">Consumer Profile</Text>
                <Divider />
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Name</Text>
                    <Text as="span">{consumer?.displayName ?? "—"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Email</Text>
                    <Text as="span">{consumer?.email ?? "—"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Phone</Text>
                    <Text as="span">{consumer?.phone ?? "—"}</Text>
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
                <Text as="h2" variant="headingSm">Consumer History (12M)</Text>
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
                    <Text as="span">{formatUSD(consumerShop12m?.netSales ?? 0)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Units Sold</Text>
                    <Text as="span">{consumerShop12m?.netUnits ?? 0}</Text>
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
              <Text as="h2" variant="headingSm">Offer Summary</Text>
              <Divider />
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Date</Text>
                    <Text as="span">
                      {formatDateTime(offer.created_at ?? offer.modifiedDate ?? "")}
                    </Text>
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
                    <Text as="span">{campaign?.name ?? "—"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Program</Text>
                    <Text as="span">{program?.name ?? "—"}</Text>
                  </InlineStack>
                </BlockStack>
              </InlineGrid>

              {program?.acceptRate != null && (
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd" tone="subdued">Accept Rate</Text>
                  <Text as="span" variant="bodyMd">
                    {formatPercent(Number(program.acceptRate) / 100)}
                  </Text>
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Counter Offers Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingSm">Counter Offers</Text>
                <Button onClick={() => navigate(`/app/offers/counter/new?offersID=${offersID}`)}>
                  Create Counter Offer
                </Button>
              </InlineStack>
              <Divider />
              
              {counterOffers.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'numeric', 'text']}
                  headings={[
                    'Counter #',
                    'Status',
                    'Type',
                    'Counter Price',
                    'Discount',
                    'Accept Prob',
                    'Created',
                  ]}
                  rows={counterRows}
                />
              ) : (
                <Text as="p" tone="subdued">
                  No counter offers yet. Click "Create Counter Offer" to send a counter offer to this customer.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Item Breakdown */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">Item Breakdown</Text>
              <Divider />
              <DataTable
                columnContentTypes={[
                  "text", "text", "text", "numeric", "numeric", "numeric",
                  "numeric", "numeric", "numeric", "numeric", "numeric", "numeric",
                ]}
                headings={[
                  "Status", "Item (Variant)", "SKU", "Qty", "Sell Price", "COGS",
                  "Profit", "Allowances", "Total", "MMU %", "Profit", "MMU $",
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
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Link to Cart */}
        {cart && (
          <Layout.Section>
            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span">View full cart details and profitability</Text>
                <Button url={`/app/carts/${cart.id}`}>View Cart</Button>
              </InlineStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

// Helper function for counter offer status badge colors
function getCounterStatusTone(status: string | null): "success" | "critical" | "attention" | undefined {
  if (!status) return undefined;
  if (status.toLowerCase().includes('accept')) return 'success';
  if (status.toLowerCase().includes('decline') || 
      status.toLowerCase().includes('expire') || 
      status.toLowerCase().includes('withdraw')) return 'critical';
  return 'attention';
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

/*
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getShopSingleOffer} from "../lib/queries/supabase/getShopSingleOffer";
import type { CounterOfferRow, ConsumerRow, GetShopSingleOfferPayload } from "../lib/types/dbTables";
import { useLoaderData, useRouteError, useNavigate, Link, redirect} from "@remix-run/react";
import { Page, Layout, Card, BlockStack, InlineGrid, InlineStack, Text, Divider,
  Badge, DataTable, Button, ButtonGroup} from "@shopify/polaris";
import { formatCurrencyUSD, formatUSD, formatDateTime, formatPercent } from "../utils/format";


type LoaderData = {
  offersID: number;
  payload: GetShopSingleOfferPayload;
  consumers: ConsumerRow | null;
  counterOffers: CounterOfferRow[];  
   math: {
    offerPrice: number;
    cartPrice: number;
    delta: number;
    unitCount: number;
    itemCount: number;
    totals: {
      totalAllowance: number;
      totalMMUDollars: number;
      grossMargin: number;
      grossMarginPct: number;
      totalSettle: number;
    };
    rows: Array<{
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
    }>;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const offersID = Number(params.id);
  if (!Number.isFinite(offersID)) throw new Response("Invalid Offer id", { status: 400 });
  const payload = await getShopSingleOffer(shopsID, offersID);
   const counterOffers: CounterOfferRow[] = Array.isArray(payload.counterOffers)
    ? (payload.counterOffers as CounterOfferRow[])
    : [];
  const consumers: ConsumerRow | null = (payload.consumers ?? null) as ConsumerRow | null;


  // === Keep your existing math here (unchanged) ===
  const offerPrice = Number(payload.offers.offerPrice ?? 0);
  const cartPrice = Number(
    payload.carts?.cartTotalPrice ?? payload.carts?.cartItemsSubtotal ?? 0
  );
  const delta = Math.max(cartPrice - offerPrice, 0);
  const items = (payload.cartitems ?? []).filter(Boolean);
  const n = (v: any) => Number(v ?? 0);

  const totalSell = items.reduce((s, it) => s + n(it.unitPrice) * n(it.units), 0);
  let totalAllowance = 0, totalMMUDollars = 0, totalSettle = 0;
  const rows: LoaderData["math"]["rows"] = [];

  items.forEach((it) => {
    const qty = n(it.units);
    const unitPrice = n(it.unitPrice);
    const unitCost = n(it.unitCost);
    const lineTotalPrice = unitPrice * qty;
    const lineTotalCost = unitCost * qty;

    const allowance = totalSell > 0 ? (lineTotalPrice / totalSell) * delta : 0;
    const lineSettle = Math.max(lineTotalPrice - allowance, 0);
    const itemSettlePrice = lineSettle / qty;

    const lineProfit = lineSettle - lineTotalCost;
    const unitProfit = lineProfit / qty;
    const mmuPct = lineSettle > 0 ? lineProfit / lineSettle : 0;

    totalAllowance += allowance;
    totalMMUDollars += lineProfit;
    totalSettle += lineSettle;

    const label =
      it.name ?? it.productName ?? it.variants?.name ?? `Product ${it.variantGID?.split('/').pop() ?? 'Unknown'}`;
    const sku = it.sku ?? it.variants?.variantSKU ?? null;

    rows.push({
      status: "Selling",
      itemLabel: label,
      sku,
      qty,
      sellPrice: unitPrice,
      cogs: unitCost,
      allowance: allowance / qty,
      mmuPct: unitPrice > 0 ? (unitPrice - unitCost) / unitPrice : 0,
      profit: unitPrice - unitCost,
      mmuDollars: unitPrice - unitCost,
      rowTotal: unitPrice,
    });

    rows.push({
      status: "Settle",
      itemLabel: label,
      sku,
      qty,
      sellPrice: itemSettlePrice,
      cogs: unitCost,
      allowance: 0,
      mmuPct,
      profit: unitProfit,
      mmuDollars: unitProfit,
      rowTotal: itemSettlePrice,
    });
  });

  const totalCogs = items.reduce((s, it) => s + n(it.unitCost) * n(it.units), 0);
  const grossMargin = totalSettle - totalCogs;
  const grossMarginPct = totalSettle > 0 ? grossMargin / totalSettle : 0;

  return json<LoaderData>({
    offersID,
    payload,
    counterOffers,
    consumers,
    math: {
      offerPrice,
      cartPrice,
      delta,
      unitCount: items.reduce((s, it) => s + n(it.units), 0),
      itemCount: items.length,
      totals: {
        totalAllowance,
        totalMMUDollars,
        grossMargin,
        grossMarginPct,
        totalSettle,
      },
      rows,
    },
  });
};


// ---------- Component ----------
export default function OfferDetailPage() {
  const { payload, counterOffers, math, offersID } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const offers = payload.offers;
  const consumers: ConsumerRow | null = payload.consumers;
  const consumerShop12m = payload.consumerShop12M; // <- note lower-case m
  const carts = payload.carts;
  const program = payload.programs;
  const campaign = payload.campaigns;
  const isPending = offers.offerStatus === "Pending Review";

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
    formatCurrencyUSD(row.profit),
    formatCurrencyUSD(row.mmuDollars),
  ]);

  // Counter offers table rows
 const counterRows = counterOffers.map((co: CounterOfferRow) => [
    <Link to={`/app/offers/counter/${co.id}`}>#{co.id}</Link>,
    <Badge tone={getCounterStatusTone(co.offerStatus)}>{co.offerStatus || "Draft"}</Badge>,
    co.counterType || "—",
    formatCurrencyUSD(co.counterOfferPrice),
    formatCurrencyUSD(co.totalDiscountCents),
    formatPercent((co.predictedAcceptanceProbability || 0) / 100),
    formatDateTime(co.createDate),
  ]);
 
  return (
    <Page
      title="Offer Details"
      subtitle={consumers?.displayName ?? consumers?.email ?? ""}
      backAction={{ content: "Offers", url: "/app/offers" }}
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

        {isPending && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">Actions</Text>
                <Divider />
                <ButtonGroup>
                  <Button
                    variant="primary"
                    tone="success"
                    onClick={() => {
                      console.log('Accept offer:', offersID);
                      alert('Accept functionality coming soon!');
                    }}
                  >
                    Accept Offer
                  </Button>
                  <Button onClick={() => navigate(`/app/offers/counter/new?offersID=${offersID}`)}>
                    Create Counter Offer
                  </Button>
                  <Button
                    tone="critical"
                    onClick={() => {
                      console.log('Decline offer:', offersID);
                      alert('Decline functionality coming soon!');
                    }}
                  >
                    Decline Offer
                  </Button>
                </ButtonGroup>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

  
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">Consumer Profile</Text>
                <Divider />
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Name</Text>
                    <Text as="span">{consumers?.displayName ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Email</Text>
                    <Text as="span">{consumers?.email ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Phone</Text>
                    <Text as="span">{consumers?.phone ?? "-"}</Text>
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
                <Text as="h2" variant="headingSm">Consumer History (12M)</Text>
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
                    <Text as="span">{formatUSD(consumerShop12m?.netSales ?? 0)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Units Sold</Text>
                    <Text as="span">{consumerShop12m?.netUnits ?? 0}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

  
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">Offer Summary</Text>
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
                    <Text as="span">{campaign?.name ?? "-"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Program</Text>
                    <Text as="span">{program?.name ?? "-"}</Text>
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


        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingSm">Counter Offers</Text>
                <Button url={`/app/offers/counter/${counterOffers}?offersID=${offersID}`}>
                  Review Counter Offer
                </Button>
              </InlineStack>
              <Divider />
              
              {counterOffers.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'numeric', 'text']}
                  headings={[
                    'Counter #',
                    'Status',
                    'Type',
                    'Counter Price',
                    'Discount',
                    'Accept Prob',
                    'Created',
                  ]}
                  rows={counterRows}
                />
              ) : (
                <Text as="p" tone="subdued">
                  No counter offers yet. Click "Create Counter Offer" to send a counter offer to this customer.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">Item Breakdown</Text>
              <Divider />
              <DataTable
                columnContentTypes={[
                  "text", "text", "text", "numeric", "numeric", "numeric",
                  "numeric", "numeric", "numeric", "numeric", "numeric", "numeric",
                ]}
                headings={[
                  "Status", "Item (Variant)", "SKU", "Qty", "Sell Price", "COGS",
                  "Profit", "Allowances", "Total", "MMU %", "Profit", "MMU $",
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
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Helper function for counter offer status badge colors
function getCounterStatusTone(status: string | null): "success" | "critical" | "attention" | undefined {
  if (!status) return undefined;
  if (status.includes('Accepted')) return 'success';
  if (status.includes('Declined') || status.includes('Expired') || status.includes('Withdrawn')) return 'critical';
  if (status.includes('Sent') || status.includes('Pending') || status.includes('Draft')) return 'attention';
  return undefined;
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
*/