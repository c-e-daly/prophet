// app/routes/app.carts.$id.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text, BlockStack, InlineStack, Divider,
  DataTable, Badge, Button,} from "@shopify/polaris";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getShopSingleCart} from "../lib/queries/supabase/getShopSingleCart";
import type { CartDetailsPayload } from "../lib/types/dbTables";
import { formatCurrencyUSD, formatDateTime, formatPercent } from "../utils/format";

type LoaderData = {
  details: CartDetailsPayload;
  calculations: {
    cartTotal: number;
    offerPrice: number;
    delta: number;
    deltaPercent: number;
    totalItems: number;
    totalUnits: number;
    aur: number; // Average Unit Revenue
    totalCOGS: number;
    totalProfitMU: number;
    totalAllowances: number;
    retainedMU: number;
    mmuPercent: number;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const cartsID = Number(params.id);

  if (!cartsID || isNaN(cartsID)) {
    throw new Response("Invalid cart ID", { status: 400 });
  }

  const details = await getShopSingleCart(shopsID, cartsID);

  if (!details) {
    throw new Response("Cart not found", { status: 404 });
  }

  const cartTotal = details.carts?.cartTotalPrice ?? 0;
  const offerPrice = details.offers?.offerPrice ?? 0;
  const delta = cartTotal - offerPrice;
  const deltaPercent = cartTotal > 0 ? (delta / cartTotal) * 100 : 0;
  
  const totalUnits = details.cartItems?.reduce(
    (sum, item) => sum + (item.cartItem?.units ?? 0),
    0
  ) ?? 0;
  
  const totalItems = details.cartItems?.length ?? 0;
  const aur = totalUnits > 0 ? cartTotal / totalUnits : 0;

  // Calculate cart-level rollups
  const totalCOGS = details.cartItems?.reduce(
    (sum, item) => sum + ((item.cartItem?.lineCost ?? 0)),
    0
  ) ?? 0;

  const totalProfitMU = details.cartItems?.reduce(
    (sum, item) => sum + ((item.cartItem?.unitProfitMU ?? 0) * (item.cartItem?.units ?? 0)),
    0
  ) ?? 0;

  const totalAllowances = details.cartItems?.reduce(
    (sum, item) => sum + ((item.cartItem?.lineAllowances ?? 0)),
    0
  ) ?? 0;

  const retainedMU = cartTotal - totalCOGS;
  const totalMU = totalProfitMU + totalAllowances;
  const mmuPercent = totalMU > 0 ? (retainedMU / totalMU) * 100 : 0;

  return json<LoaderData>({
    details,
    calculations: {
      cartTotal,
      offerPrice,
      delta,
      deltaPercent,
      totalItems,
      totalUnits,
      aur,
      totalCOGS,
      totalProfitMU,
      totalAllowances,
      retainedMU,
      mmuPercent,
    },
  });
};

export default function CartDetailPage() {
  const { details, calculations } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const {
    carts,
    consumers,
    offers,
    programs,
    cartItems,
    consumerShop12M,
    consumerShopCPMS,
    consumerShopLTV,
  } = details;

  // Mask cart token (show first 10 and last 10 chars)
  const maskedToken = carts.cartToken && carts.cartToken.length > 20
    ? `${carts.cartToken.slice(0, 10)}...${carts.cartToken.slice(-10)}`
    : carts.cartToken;

  // Enhanced item rows with all financial details
  const itemRows = cartItems?.map((item) => {
    const variantName = item.cartItem?.name ?? "—";
    const sku = item.cartItem?.sku ?? "—";
    const qty = item.cartItem?.units ?? 0;
    const lineCost = item.cartItem?.lineCost ?? 0;
    const profitMU = (item.cartItem?.unitProfitMU ?? 0) * qty;
    const allowances = item.cartItem?.lineAllowances ?? 0;
    const adjust = item.cartItem?.unitMarketAdjust ?? 0;
    const price = item.cartItem?.unitPrice ?? 0;
    const subtotal = item.cartItem?.linePrice ?? 0;

    return [
      variantName,
      sku,
      String(qty),
      formatCurrencyUSD(lineCost),
      formatCurrencyUSD(profitMU),
      formatCurrencyUSD(allowances),
      formatCurrencyUSD(adjust),
      formatCurrencyUSD(price),
      formatCurrencyUSD(subtotal),
    ];
  }) ?? [];

  const getStatusTone = (status: string | null) => {
    if (!status) return "info";
    if (status.includes("Offered")) return "warning";
    if (status.includes("Abandoned")) return "critical";
    return "info";
  };

  return (
    <Page
      title={`${consumers?.displayName ?? "Unknown"}: Offered Cart`}
      subtitle={
        `Offer Date: ${formatDateTime(offers?.created_at)} | ` +
        `Cart Price: ${formatCurrencyUSD(calculations.cartTotal)} | ` +
        `Offer Price: ${formatCurrencyUSD(calculations.offerPrice)} | ` +
        `Offer Status: ${offers?.offerStatus ?? "No Offer"}`
      }
      backAction={{ url: "/app/carts" }}
    >
      <Layout>
        {/* Left Column - Main Content */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Cart Summary */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Cart Summary
                </Text>
                <Divider />

                <InlineStack gap="600" wrap>
                  <BlockStack gap="100">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Create Date
                    </Text>
                    <Text as="span" fontWeight="medium">
                      {formatDateTime(carts.createDate ?? "")}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Token
                    </Text>
                    <Text as="span" variant="bodyXs">
                      {maskedToken ?? "—"}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Items
                    </Text>
                    <Text as="span" fontWeight="medium">
                      {calculations.totalItems}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Units
                    </Text>
                    <Text as="span" fontWeight="medium">
                      {calculations.totalUnits}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="span" tone="subdued" variant="bodySm">
                      AUR
                    </Text>
                    <Text as="span" fontWeight="medium">
                      {formatCurrencyUSD(calculations.aur)}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Status
                    </Text>
                    <Badge tone={getStatusTone(carts.cartStatus)}>
                      {carts.cartStatus ?? "Unknown"}
                    </Badge>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Cart Level Rollups */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Cart Level Rollups
                </Text>
                <Divider />

                <DataTable
                  columnContentTypes={[
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                  ]}
                  headings={[
                    "COGS",
                    "Profit MU",
                    "Shrink",
                    "Discounts",
                    "Finance",
                    "Shipping",
                    "Adjust",
                    "Total MU",
                    "Cart Price",
                  ]}
                  rows={[
                    [
                      formatCurrencyUSD(calculations.totalCOGS),
                      formatCurrencyUSD(calculations.totalProfitMU),
                      formatCurrencyUSD(carts.cartShrinkMarkup ?? 0),
                      formatCurrencyUSD(carts.cartDiscountMarkup ?? 0),
                      formatCurrencyUSD(carts.cartFinanceMarkup ?? 0),
                      formatCurrencyUSD(0), // Shipping not on cart level
                      formatCurrencyUSD(carts.cartMarketMarkup ?? 0),
                      formatCurrencyUSD(calculations.totalProfitMU + calculations.totalAllowances),
                      formatCurrencyUSD(calculations.cartTotal),
                    ],
                  ]}
                />
              </BlockStack>
            </Card>

            {/* Cart Items Detail */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Cart Items
                </Text>
                <Divider />

                {cartItems && cartItems.length > 0 ? (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                    ]}
                    headings={[
                      "Variant Name",
                      "SKU",
                      "Qty",
                      "COGS",
                      "Profit MU",
                      "Allowances",
                      "Adjust",
                      "Price",
                      "Subtotal",
                    ]}
                    rows={itemRows}
                    footerContent={
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodySm">
                          {calculations.totalItems} items, {calculations.totalUnits} units
                        </Text>
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          Total: {formatCurrencyUSD(calculations.cartTotal)}
                        </Text>
                      </InlineStack>
                    }
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    No items found
                  </Text>
                )}
              </BlockStack>
            </Card>

            {/* Campaign */}
            {offers && programs && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Campaign
                  </Text>
                  <Divider />

                  <InlineStack gap="600" wrap>
                    <BlockStack gap="100">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Program
                      </Text>
                      <Text as="span" fontWeight="medium">
                        {programs.name ?? "—"}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Code
                      </Text>
                      <Text as="span" fontWeight="medium">
                        {programs.codePrefix ?? "—"}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Accept Rate
                      </Text>
                      <Text as="span">
                        {programs.acceptRate ?? 0}%
                      </Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Decline Rate
                      </Text>
                      <Text as="span">
                        {programs.declineRate ?? 0}%
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>
            )}

            {/* Counter Offer */}
            {details.counterOffers && details.counterOffers.length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Counter Offers
                  </Text>
                  <Divider />

                  {details.counterOffers.map((counter) => (
                    <InlineStack key={counter.id} gap="600" wrap>
                      <BlockStack gap="100">
                        <Text as="span" tone="subdued" variant="bodySm">
                          Counter ID
                        </Text>
                        <Text as="span" fontWeight="medium">
                          #{counter.id}
                        </Text>
                      </BlockStack>

                      <BlockStack gap="100">
                        <Text as="span" tone="subdued" variant="bodySm">
                          Status
                        </Text>
                        <Badge>
                          {counter.offerStatus ?? "Pending"}
                        </Badge>
                      </BlockStack>

                      <BlockStack gap="100">
                        <Text as="span" tone="subdued" variant="bodySm">
                          Created
                        </Text>
                        <Text as="span">
                          {formatDateTime(counter.createDate ?? "")}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>

        {/* Right Sidebar */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Action Buttons */}
            <Card>
              <BlockStack gap="200">
                <Button variant="secondary" fullWidth>
                  Archive Cart
                </Button>
                <Button
                  fullWidth
                  onClick={() => navigate(`/app/offers/${offers?.id}`)}
                  disabled={!offers}
                >
                  View Offer
                </Button>
                <Button
                  fullWidth
                  onClick={() => navigate(`/app/consumers/${consumers?.id}`)}
                  disabled={!consumers}
                >
                  View Consumer
                </Button>
              </BlockStack>
            </Card>

            {/* Deal Summary */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Deal Summary
                </Text>
                <Divider />

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">
                      Forecasted Gross Profit:
                    </Text>
                    <Text as="span" fontWeight="semibold">
                      {formatCurrencyUSD(calculations.retainedMU)}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">
                      MMU % (Retained/Total):
                    </Text>
                    <Text as="span" fontWeight="semibold">
                      {formatPercent(calculations.mmuPercent / 100, 1)}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">
                      Items:
                    </Text>
                    <Text as="span" fontWeight="medium">
                      {calculations.totalItems}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">
                      Units:
                    </Text>
                    <Text as="span" fontWeight="medium">
                      {calculations.totalUnits}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Customer Context */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Customer Context
                </Text>
                <Divider />

                {consumers ? (
                  <BlockStack gap="200">
                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Name
                      </Text>
                      <Text as="span" fontWeight="medium">
                        {consumers.displayName ?? "—"}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Email (masked)
                      </Text>
                      <Text as="span" variant="bodySm">
                        {consumers.email
                          ? `${consumers.email.slice(0, 3)}***@***`
                          : "—"}
                      </Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Portfolio
                      </Text>
                      <Text as="span" fontWeight="medium">
                        {consumerShopCPMS?.name ?? "—"}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Current 12M Spend
                      </Text>
                      <Text as="span" fontWeight="semibold">
                        {consumerShop12M?.grossSales
                          ? formatCurrencyUSD(consumerShop12M.grossSales)
                          : "—"}
                      </Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Offers Made
                      </Text>
                      <Text as="span">{consumerShopLTV?.totalOffers ?? 0}</Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Orders Made
                      </Text>
                      <Text as="span">{consumerShopLTV?.totalOrders ?? 0}</Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        Total Net Sales
                      </Text>
                      <Text as="span" fontWeight="semibold">
                        {consumerShopLTV?.totalNetSales
                          ? formatCurrencyUSD(consumerShopLTV.totalNetSales)
                          : "—"}
                      </Text>
                    </BlockStack>
                  </BlockStack>
                ) : (
                  <Text as="p" tone="subdued">
                    No consumer data available
                  </Text>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
/*
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

*/