// app/routes/app.offers.$id.tsx
import { json, type LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError, Form, useNavigate, Link, redirect} from "@remix-run/react";
import { Page, Layout, Card, BlockStack, InlineGrid, InlineStack, Text, Divider,
  Badge, DataTable, Button, ButtonGroup} from "@shopify/polaris";
import { formatCurrencyUSD, formatUSD, formatDateTime, formatPercent } from "../utils/format";
import type { Database } from "../../supabase/database.types";
import { getShopSingleOffer } from "../lib/queries/supabase/getShopSingleOffer";
import { getCounterOffersForOffer } from "../lib/queries/supabase/getShopCountersByOffer";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import createClient from "../../supabase/server";

// TYPE DEFINITIONS
type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type ConsumerShop12mRow = Database["public"]["Views"]["consumerShop12m"]["Row"];

type OfferRow = Tables<"offers"> & {
  carts: Tables<"carts"> | null;
  consumers: Tables<"consumers"> | null;
  campaigns: Tables<"campaigns"> | null;
  programs: Tables<"programs"> | null;
  cartitems: (Tables<"cartitems"> & {
    variants: Tables<"variants"> | null;
  })[];
};

type CounterOfferRow = Tables<"counterOffers">;

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
  counterOffers: CounterOfferRow[];
  consumerShop12m: ConsumerShop12mRow | null; 
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
    shopsID: number;
  };
};

// ---------- Loader ----------
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, session } = await getAuthContext(request);
  const url = new URL(request.url);
  const offersID = Number(params.id);
  
  if (!Number.isFinite(offersID)) {
    throw new Response("Invalid Offer id", { status: 400 });
  }

 
  const [result, counterOffers] = await Promise.all([
    getShopSingleOffer({
      request,
      shopsID: shopsID,
      offersID: offersID
    }),
    getCounterOffersForOffer(shopsID, offersID)
  ]);

  const offers = result.offer;
  const consumerShop12m = result.consumerShop12m;

  if (!offers) {
    throw new Response("Offer not found", { status: 404 });
  }


  
  // PRICING MATH AND DISCOUNT ALLOCATIONS ///
  const offerPrice = Number(offers.offerPrice ?? 0);
  const cartPrice = Number(offers.carts?.cartTotalPrice ?? offers.carts?.cartItemsSubtotal ?? 0);
  const delta = Math.max(cartPrice - offerPrice, 0);
  const items = (offers.cartitems ?? []).filter(Boolean);
  const safeNumber = (value: any): number => Number(value ?? 0);
  const totalSell = items.reduce((sum, item) => 
    sum + safeNumber(item.unitPrice) * safeNumber(item.units), 0
  );

  const rows: ItemRow[] = [];
  let totalAllowance = 0;
  let totalMMUDollars = 0;
  let totalSettle = 0;

  items.forEach((item) => {
    const qty = safeNumber(item.units);
    const unitPrice = safeNumber(item.unitPrice);
    const unitCost = safeNumber(item.unitCost);
    const lineTotalPrice = unitPrice * qty;
    const lineTotalCost = unitCost * qty;
    
    const allowance = totalSell > 0 ? (lineTotalPrice / totalSell) * delta : 0;
    const lineSettlePrice = Math.max(lineTotalPrice - allowance, 0);
    const itemSettlePrice = lineSettlePrice / qty;
    
    const lineProfit = lineSettlePrice - lineTotalCost;
    const unitProfit = lineProfit / qty;
    const mmuPct = lineSettlePrice > 0 ? lineProfit / lineSettlePrice : 0;
    
    totalAllowance += allowance;
    totalMMUDollars += lineProfit;
    totalSettle += lineSettlePrice;
    
    const itemLabel = 
      item.name ?? 
      item.productName ?? 
      item.variants?.name ?? 
      `Product ${item.variantGID?.split('/').pop() ?? 'Unknown'}`;
    
    const sku = item.sku ?? item.variants?.variantSKU ?? null;
    
    rows.push({
      status: "Selling",
      itemLabel,
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
      itemLabel,
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

  const itemCount = items.length;
  const unitCount = items.reduce((sum, item) => 
    sum + safeNumber(item.units), 0
  );

  const totalCogs = items.reduce((sum, item) => 
    sum + safeNumber(item.unitCost) * safeNumber(item.units), 0
  );

  const grossMargin = totalSettle - totalCogs;
  const grossMarginPct = totalSettle > 0 ? grossMargin / totalSettle : 0;

  return json<LoaderData>({
    offersID,
    host: url.searchParams.get("host"),
    offers: offers as OfferRow,
    counterOffers,
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
      shopDomain: session.shop,
      shopsID: shopsID,
    }
  });
};


// ----------- Actions ----------
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const offersID = Number(params.id);
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "create_counter") {
    // Create draft counter offer
    const supabase = createClient();
    
    const { data: newCounter, error } = await supabase
      .from("counterOffers")
      .insert({
        shop: shopsID,
        offer: offersID,
        offerStatus: "Draft",
        counterType: "percent_off_order", // Default type
        counterConfig: { type: "percent_off_order", percent: 10 }, // Default config
        createDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating counter offer:", error);
      throw new Response("Failed to create counter offer", { status: 500 });
    }
    
    // Redirect to counter offer edit page
    return redirect(`/app/offers/counter/${newCounter.id}`);
  }

  return null;
};

// ---------- Component ----------
export default function OfferDetailPage() {
  const { offers, counterOffers, consumerShop12m, math, offersID } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const consumer = offers.consumers;
  const carts = offers.carts;
  const program = offers.programs;
  const campaign = offers.campaigns;

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
  const counterRows = counterOffers.map((co) => [
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
      subtitle={consumer?.displayName ?? consumer?.email ?? ""}
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
                  <Form method="post">
                    <input type="hidden" name="intent" value="create_counter" />
                    <Button submit>
                      Create Counter Offer
                    </Button>
                  </Form>                  


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

        {/* Counter Offers Section - NEW */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingSm">Counter Offers</Text>
                <Form method="post">
                    <input type="hidden" name="intent" value="create_counter" />
                    <Button size="slim" submit>
                      Create Counter Offer
                    </Button>
                  </Form> 
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
