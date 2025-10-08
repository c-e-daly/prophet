// app/routes/app.carts.$id.tsx
import * as React from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text, BlockStack, InlineStack, Divider, DataTable, Badge,
  Button, Banner} from "@shopify/polaris";
import { getSingleCartDetails,  cartProfitability, type CartProfitability 
} from "../lib/queries/supabase/getShopCartItems";
import type { CartDetailsPayload,  CartItemPricing,  OfferStatusEnum} from "../lib/types/dbTables";
import { formatCurrencyUSD, formatDateTime, formatPercent } from "../utils/format";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

type LoaderData = {

  details: CartDetailsPayload;
  profitability: CartProfitability;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);

  const url = new URL(request.url);
  const cartID = Number(params.id);
  
  if (!cartID || isNaN(cartID)) {
    throw new Response("Invalid cart ID", { status: 400 });
  }
  const details = await getSingleCartDetails(shopsID, cartID);

  if (!details) {
    throw new Response("Cart not found", { status: 404 });
  }

  const profitability = cartProfitability(details.items);

  return json<LoaderData>({
      details,
    profitability,
  });
};

export default function CartReviewPage() {
  const { details, profitability } = useLoaderData<typeof loader>();

  const { cart, consumer, offer, items } = details;

  const itemRows = items.map((item) => {
  const units = item.cartItem.units ?? 0;
  const unitPrice = item.cartItem.unitPrice ?? 0;
  const costPerUnit = item.variantPricing?.itemCost ?? null;
  
  const lineTotal = units * unitPrice;
  const lineCost = costPerUnit !== null ? units * costPerUnit : null;
  const lineProfit = lineCost !== null ? lineTotal - lineCost : null;
  const lineMargin = lineCost !== null && lineTotal > 0 
    ? ((lineProfit! / lineTotal) * 100) 
    : null;

  return [
    String(item.cartItem.id),
    item.cartItem.name ?? "—",
    item.cartItem.sku ?? "—",
    String(units),
    formatCurrencyUSD(unitPrice),
    formatCurrencyUSD(lineTotal),
    costPerUnit !== null ? formatCurrencyUSD(costPerUnit) : "—",
    lineProfit !== null ? formatCurrencyUSD(lineProfit) : "—",
    lineMargin !== null ? formatPercent(lineMargin / 100, 1) : "—",
  ];
});

const totalItemCount = items.reduce((sum, item) => sum + (item.cartItem.units ?? 0), 0);

  // Safely handle null cartTotalPrice
  const cartTotal = cart.cartTotalPrice ?? 0;
  const offerDiscount = offer 
    ? cartTotal - (offer.offerPrice ?? 0)
    : 0;
  const offerDiscountPercent = offer && cartTotal > 0
    ? (offerDiscount / cartTotal) * 100
    : 0;

  const offerProfit = offer && profitability.totalCost > 0
    ? (offer.offerPrice ?? 0) - profitability.totalCost
    : null;
  const offerMargin = offer && offerProfit !== null && (offer.offerPrice ?? 0) > 0
    ? (offerProfit / (offer.offerPrice ?? 1)) * 100
    : null;

  return (
    <Page 
      title={`Cart #${cart.id}`} 
      subtitle={cart.cartToken ? `Token: ${cart.cartToken}` : undefined}
      backAction={{ url: '/app/carts' }}
    >
      <BlockStack gap="400">
        {profitability.itemsWithoutPricing > 0 && (
          <Banner tone="warning">
            <p>
              {profitability.itemsWithoutPricing} item(s) missing cost data. 
              Profitability metrics are incomplete. 
              <Button variant="plain" url="/app/settings/pricing">
                Update Pricing
              </Button>
            </p>
          </Banner>
        )}

        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Profitability Analysis</Text>
              <Badge tone={ profitability.averageMargin > 30 ? "success" :
                profitability.averageMargin > 15 ? "warning" : "critical" }>
                {formatPercent(profitability.averageMargin / 100, 1)} Margin
              </Badge>
              </InlineStack>
            <Divider />
            
            <InlineStack gap="600" wrap={true}>
              <BlockStack gap="100">
                <Text as="span" tone="subdued" variant="bodySm">Total Revenue</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {formatCurrencyUSD(profitability.totalRevenue)}
                </Text>
              </BlockStack>

              <BlockStack gap="100">
                <Text as="span" tone="subdued" variant="bodySm">Total Cost (COGS)</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {profitability.totalCost > 0 
                    ? formatCurrencyUSD(profitability.totalCost)
                    : "—"}
                </Text>
              </BlockStack>

              <BlockStack gap="100">
                <Text as="span" tone="subdued" variant="bodySm">Gross Profit</Text>
                <Text as="p" variant="headingLg" fontWeight="bold" tone={
                  profitability.totalProfit > 0 ? "success" : "critical"
                }>
                  {profitability.totalProfit > 0
                    ? formatCurrencyUSD(profitability.totalProfit)
                    : "—"}
                </Text>
              </BlockStack>
            </InlineStack>

            {offer && offerProfit !== null && (
              <>
                <Divider />
                <BlockStack gap="100">
                  <Text as="span" variant="headingSm">If Offer Accepted</Text>
                  <InlineStack gap="600" wrap={true}>
                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">Discount</Text>
                      <Text as="span" fontWeight="semibold">
                        {formatCurrencyUSD(offerDiscount)} 
                        ({formatPercent(offerDiscountPercent / 100, 1)})
                      </Text>
                    </BlockStack>
                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">Revenue</Text>
                      <Text as="span" fontWeight="semibold">
                        {formatCurrencyUSD(offer.offerPrice ?? 0)}
                      </Text>
                    </BlockStack>
                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">Profit</Text>
                      <Text as="span" fontWeight="semibold" tone={
                        offerProfit > 0 ? "success" : "critical"
                      }>
                        {formatCurrencyUSD(offerProfit)}
                      </Text>
                    </BlockStack>
                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">Margin</Text>
                      <Text as="span" fontWeight="semibold">
                        {offerMargin !== null ? formatPercent(offerMargin / 100, 1) : "—"}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Cart Summary</Text>
              <Badge tone={
                cart.cartStatus === "Offered" ? "warning" : 
                cart.cartStatus === "Abandoned" ? "critical" :
                cart.cartStatus === "Checkout" ? "info" : "info"
              }>
                {cart.cartStatus ?? "unknown"}
              </Badge>
            </InlineStack>
            <Divider />
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">Created</Text>
              <Text as="span" fontWeight="medium">
                {formatDateTime(cart.createDate ?? "")}
              </Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">Items</Text>
              <Text as="span" fontWeight="medium">
                {cart.cartItemCount ?? 0}
              </Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">Cart Total</Text>
              <Text as="span" fontWeight="semibold">
                {formatCurrencyUSD(cartTotal)}
              </Text>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">Consumer</Text>
            <Divider />
            {consumer ? (
              <BlockStack gap="100">
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Name</Text>
                  <Text as="span" fontWeight="medium">
                    {[consumer.firstName, consumer.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Email</Text>
                  <Text as="span">{consumer.email ?? "—"}</Text>
                </InlineStack>
                {consumer.phone && (
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Phone</Text>
                    <Text as="span">{consumer.phone}</Text>
                  </InlineStack>
                )}
              </BlockStack>
            ) : (
              <Text as="p" tone="subdued">No consumer linked to this cart.</Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Offer</Text>
              {offer && (
                <Button 
                  variant="plain" 
                  url={`/app/offers/${offer.id}`}
                >
                  View Details
                </Button>
              )}
            </InlineStack>
            <Divider />
            {offer ? (
              <BlockStack gap="100">
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Offer ID</Text>
                  <Text as="span" fontWeight="medium">#{offer.id}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Status</Text>
                    <Badge tone={
                      offer.offerStatus === "Consumer Accepted" || 
                      offer.offerStatus === "Reviewed Accepted" ||
                      offer.offerStatus === "Accepted Consumer Counter" ||
                      offer.offerStatus === "Auto Accepted" ? "success" :
                      offer.offerStatus === "Consumer Declined" || 
                      offer.offerStatus === "Reviewed Declined" ||
                      offer.offerStatus === "Declined Consumer Counter" ||
                      offer.offerStatus === "Auto Declined" ? "critical" :
                      "info"
                    }>
                      {offer.offerStatus ?? "—"}
                    </Badge>
                   </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Offer Price</Text>
                  <Text as="span" fontWeight="semibold">
                    {formatCurrencyUSD(offer.offerPrice ?? 0)}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Discount</Text>
                  <Text as="span">
                    {formatCurrencyUSD(offerDiscount)} 
                    ({formatPercent(offerDiscountPercent / 100, 1)})
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" tone="subdued">Created</Text>
                  <Text as="span">
                    {formatDateTime(offer.created_at ?? "")}
                  </Text>
                </InlineStack>
              </BlockStack>
            ) : (
              <Text as="p" tone="subdued">
                No offer recorded for this cart yet.
              </Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Cart Items with Profitability
            </Text>
            <Divider />
            {items.length > 0 ? (
              <>
                <DataTable
                  columnContentTypes={[
                    "text", 
                    "text", 
                    "text", 
                    "numeric", 
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric"
                  ]}
                  headings={[
                    "ID", 
                    "Product", 
                    "SKU", 
                    "Qty", 
                    "Unit Price",
                    "Line Total",
                    "Unit Cost",
                    "Line Profit",
                    "Margin %"
                  ]}
                  rows={itemRows}
                />
                <Divider />
                <InlineStack align="space-between">
                  <Text as="span" variant="headingSm">Summary</Text>
                  <InlineStack gap="400" wrap={true}>
                    <Text as="span">
                      <Text as="span" tone="subdued">Items: </Text>
                      <Text as="span" fontWeight="semibold">{totalItemCount}</Text>
                    </Text>
                    <Text as="span">
                      <Text as="span" tone="subdued">Revenue: </Text>
                      <Text as="span" fontWeight="semibold">
                        {formatCurrencyUSD(profitability.totalRevenue)}
                      </Text>
                    </Text>
                    {profitability.totalCost > 0 && (
                      <>
                        <Text as="span">
                          <Text as="span" tone="subdued">Cost: </Text>
                          <Text as="span" fontWeight="semibold">
                            {formatCurrencyUSD(profitability.totalCost)}
                          </Text>
                        </Text>
                        <Text as="span">
                          <Text as="span" tone="subdued">Profit: </Text>
                          <Text as="span" fontWeight="semibold">
                            {formatCurrencyUSD(profitability.totalProfit)}
                          </Text>
                        </Text>
                      </>
                    )}
                  </InlineStack>
                </InlineStack>
              </>
            ) : (
              <Text as="p" tone="subdued">No items in this cart.</Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}