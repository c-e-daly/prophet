// app/routes/app.carts.$id.tsx
import * as React from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text, BlockStack, InlineStack, Divider, DataTable, Badge } from
  "@shopify/polaris";
import { getSingleCartDetails, type CartDetails } from "../lib/queries/supabase/getShopSingleCart";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import type { Tables } from "../../supabase/database.types";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";

type LoaderData = {
  host: string | null;
  details: CartDetails | null;
  page: number;
  statuses: string[];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);  
  const url = new URL(request.url);
  const singleCartID = Number(params.id);
    console.log("[carts.$id] pathname:", url.pathname, "params:", params);
  if (!singleCartID) throw new Response("Missing cart id", { status: 400 });

  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const statusParam = url.searchParams.get("cartStatus");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Offered", "Abandoned"];
  const host = url.searchParams.get("host");


  // Use the cached shopsId for fast queries
  const details = await getSingleCartDetails(shopsID, singleCartID, {
    page,
    statuses,
  });


  return json<LoaderData>({
    host,
    details,
    page,
    statuses
  });
};

export default function CartReviewPage() {
  const { details } = useLoaderData<typeof loader>();

  if (!details) {
    return (
      <Page title="Cart not found">
        <Card>
          <Text as="p">We couldn't find that cart. It may have been removed or you
            don't have access.</Text>
        </Card>
      </Page>
    );
  }

  const { cart, consumer, offer, items } = details;

  const itemRows = (items ?? []).map((it: Tables<'cartitems'>) => ([
    String(it.id),
    it.productName ?? "—",
    it.variantSKU ?? "—",
    String(it.variantQuantity ?? 0),
    formatCurrencyUSD(it.sellingPrice ?? 0),
  ]));

  return (
    <Page title={`Cart #${cart.id}`} subtitle={cart.cartToken ? `Token: ${cart.
      cartToken}` : undefined}>
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Cart</Text>
              <Badge tone={cart.cartStatus === "offered" ? "warning" : "info"}>
                {cart.cartStatus ?? "unknown"}
              </Badge>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span">Created</Text>
              <Text as="span">{formatDateTime(cart.cartCreateDate ?? "")}</Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span">Items</Text>
              <Text as="span">{cart.cartItemCount ?? 0}</Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span">Total (cart)</Text>
              <Text as="span">{formatCurrencyUSD(cart.cartTotalPrice ?? 0)}</Text>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <Text as="h2" variant="headingMd">Consumer</Text>
          <Divider />
          {consumer ? (
            <BlockStack gap="100">
              <InlineStack align="space-between">
                <Text as="span">Name</Text>
                <Text as="span">{[consumer.firstName, consumer.lastName].filter(Boolean).join(" ") || "—"}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span">Email</Text>
                <Text as="span">{consumer.email ?? "—"}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span">Phone</Text>
                <Text as="span">{consumer.phone ?? "—"}</Text>
              </InlineStack>
            </BlockStack>
          ) : (
            <Text as="p" tone="subdued">No consumer linked.</Text>
          )}
        </Card>

        <Card>
          <Text as="h2" variant="headingMd">Offer</Text>
          <Divider />
          {offer ? (
            <BlockStack gap="100">
              <InlineStack align="space-between"><Text as="span">ID</Text><Text as="span">{offer.id}</
              Text></InlineStack>
              <InlineStack align="space-between"><Text as="span">Status</Text><Text as="span">{offer.
                offerStatus ?? "—"}</Text></InlineStack>
              <InlineStack align="space-between"><Text as="span">Amount</Text><Text as="span">
                {formatCurrencyUSD(offer.offerPrice ?? 0)}</Text></InlineStack>
              <InlineStack align="space-between"><Text as="span">Created</Text><Text as="span">
                {formatDateTime(offer.created_at ?? "")}</Text></InlineStack>
            </BlockStack>
          ) : (
            <Text as="p" tone="subdued">No offer recorded for this cart.</Text>
          )}
        </Card>

        <Card>
          <Text as="h2" variant="headingMd">Items</Text>
          <Divider />
          <DataTable
            columnContentTypes={["text", "text", "text", "numeric", "numeric"]}
            headings={["Item ID", "Product", "Variant SKU", "Qty", "Line Price"]}
            rows={itemRows}
            totals={["", "", "", "", ""]}
            footerContent={`${items?.length ?? 0} line item(s)`}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}