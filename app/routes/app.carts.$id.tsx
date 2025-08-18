// app/routes/app.carts.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Card, Text, Button, InlineStack, BlockStack, IndexTable } from "@shopify/polaris";

import { createClient } from "../utils/supabase/server";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";

type Cart = {
  id: string | number;
  shop: string;
  cart_create_date: string | null;
  cart_item_count: number | null;
  cart_total_price: number | null; // cents
  cart_status: string | null;
};

type CartItem = {
  id: string | number;
  cart_id: string | number;
  product_title: string | null;
  variant_title: string | null;
  quantity: number | null;
  line_price: number | null; // cents
};

type LoaderData = {
  shop: string;
  cart: Cart | null;
  items: CartItem[];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  const id = params.id;

  if (!id) throw new Response("Missing cart id", { status: 400 });

  const supabase = createClient();

  // Fetch the cart (scoped to shop if provided)
  const cartQuery = supabase
    .from("carts")
    .select("id, shop, cart_create_date, cart_item_count, cart_total_price, cart_status")
    .eq("id", id)
    .maybeSingle();

  // Fetch line items
  const itemsQuery = supabase
    .from("cartitems")
    .select("id, cart_id, product_title, variant_title, quantity, line_price")
    .eq("cart_id", id)
    .order("id", { ascending: true });

  const [{ data: cart, error: cartErr }, { data: items, error: itemsErr }] =
    await Promise.all([cartQuery, itemsQuery]);

  if (cartErr) {
    // eslint-disable-next-line no-console
    console.error("Cart fetch error:", cartErr);
  }
  if (itemsErr) {
    // eslint-disable-next-line no-console
    console.error("Cart items fetch error:", itemsErr);
  }

  // Optional shop scoping
  if (shop && cart && cart.shop !== shop) {
    // Prevent cross-tenant access
    return json<LoaderData>({ shop, cart: null, items: [] }, { status: 404 });
  }

  return json<LoaderData>({
    shop,
    cart: (cart as Cart) ?? null,
    items: (items as CartItem[]) ?? [],
  });
}

export default function CartDetailRoute() {
  const { cart, items, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (!cart) {
    return (
      <Page
        title="Cart not found"
        primaryAction={{ content: "Back to Carts", onAction: () => navigate(`/app/carts?shop=${encodeURIComponent(shop)}`) }}
      >
        <Card>
          <Text as="p">This cart could not be found or you don’t have access.</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={`Cart ${cart.id}`}
      backAction={{ content: "Carts", onAction: () => navigate(`/app/carts?shop=${encodeURIComponent(shop)}`) }}
      subtitle={formatDateTime(cart.cart_create_date)}
      secondaryActions={[
        { content: "View Shopper", onAction: () => {/* add route when ready */} },
      ]}
    >
      <BlockStack gap="400">
        <Card>
          <InlineStack align="space-between">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Status</Text>
              <Text as="p">{cart.cart_status ?? "unknown"}</Text>
            </BlockStack>
            <BlockStack gap="200" align="end">
              <Text as="h3" variant="headingSm">Items</Text>
              <Text as="p">{cart.cart_item_count ?? 0}</Text>
            </BlockStack>
            <BlockStack gap="200" align="end">
              <Text as="h3" variant="headingSm">Total</Text>
              <Text as="p">{formatCurrencyUSD(cart.cart_total_price)}</Text>
            </BlockStack>
          </InlineStack>
        </Card>

        <Card>
          <IndexTable
            itemCount={items.length}
            selectable={false}
            headings={[
              { title: "Product" },
              { title: "Variant" },
              { title: "Qty" },
              { title: "Line Total" },
              { title: "" },
            ]}
          >
            {items.map((li, index) => (
              <IndexTable.Row
                id={String(li.id)}
                key={String(li.id)}
                position={index}
              >
                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">{li.product_title ?? "-"}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">{li.variant_title ?? "-"}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">{li.quantity ?? 0}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">{formatCurrencyUSD(li.line_price)}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Button variant="plain" onClick={() => {/* drill into product if desired */}}>
                    View
                  </Button>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>
      </BlockStack>
    </Page>
  );
}
