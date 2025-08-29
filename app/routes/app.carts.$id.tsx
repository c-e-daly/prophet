// app/routes/app.carts.$id.tsx
import * as React from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text, BlockStack, InlineStack, Divider, DataTable, Badge } from 
"@shopify/polaris";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { getCartDetailsRPC, type CartDetails } from "../lib/queries/getShopSingleCart";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import type { Tables } from "../../supabase/database.types";

type LoaderData = {
  shop: string;
  host: string | null;
  details: CartDetails | null;
};

export const loader = withShopLoader(async ({
  request,
  shopId,
}: {
  request: Request;
  shopId: number;
  shopDomain: string;
  brandName: string;
}) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  const host = url.searchParams.get("host");
  
  // Extract the cart id from the URL pathname
  // Assuming route is /app/carts/:id/review
  const pathname = url.pathname;
  const match = pathname.match(/\/carts\/([^\/]+)\/review/);
  const idParam = match?.[1];
  
  if (!idParam) throw new Response("Missing cart id", { status: 400 });

  // Accept numeric ids; if non‑numeric, treat as token
  const numeric = Number(idParam);
  const details = Number.isFinite(numeric)
    ? await getCartDetailsRPC(shopId, { id: numeric })
    : await getCartDetailsRPC(shopId, { token: idParam });

  return json<LoaderData>({ shop, host, details });
});

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
    formatCurrencyUSD(it.variantSellingPrice ?? 0),
  ]));

  return (
    <Page title={`Cart #${cart.id}`} subtitle={cart.cart_token ? `Token: ${cart.
cart_token}` : undefined}>
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Cart</Text>
              <Badge tone={cart.cart_status === "offered" ? "warning" : "info"}>
                {cart.cart_status ?? "unknown"}
              </Badge>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span">Created</Text>
              <Text as="span">{formatDateTime(cart.cart_create_date ?? "")}</Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span">Items</Text>
              <Text as="span">{cart.cart_item_count ?? 0}</Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span">Total (cart)</Text>
              <Text as="span">{formatCurrencyUSD(cart.cart_total_price ?? 0)}</Text>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <Text as="h2" variant="headingMd">Consumer</Text>
          <Divider />
          {consumer ? (
            <BlockStack gap="100">
              <InlineStack align="space-between"><Text as="span">Name</Text><Text as="span">{[consumer.
first_name, consumer.last_name].filter(Boolean).join(" ") || "—"}</
Text></InlineStack>
              <InlineStack align="space-between"><Text as="span">Email</Text><Text as="span">{consumer.
email ?? "—"}</Text></InlineStack>
              <InlineStack align="space-between"><Text as="span">Phone</Text><Text as="span">{consumer.
phone ?? "—"}</Text></InlineStack>
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
status ?? "—"}</Text></InlineStack>
              <InlineStack align="space-between"><Text as="span">Amount</Text><Text as="span">
{formatCurrencyUSD(offer.amount_cents ?? 0)}</Text></InlineStack>
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