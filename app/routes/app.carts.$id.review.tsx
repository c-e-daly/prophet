// app/routes/app.carts.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, IndexTable, Text, Button, Box, InlineStack } from "@shopify/polaris";
import { createClient } from "@supabase/supabase-js";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { getCartItemsForCart, type CartItemRow } from "../lib/queries/getCartItemsForCart";

// ---- helpers you can put in app/lib/queries as separate files if you prefer
async function getOfferForCart(shopId: number, cartId: number) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  // latest offer for this cart
  const { data, error } = await supabase
    .from("offers")
    .select(`
      id, status_code, created_at, discount_code, amount, 
      consumer ( id, first_name, last_name, email )
    `)
    .eq("shop", shopId)
    .eq("cart", cartId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data; // can be null if no offers
}

export const loader = (args: LoaderFunctionArgs) =>
  withShopLoader(async ({ shopId, request }) => {
    // ← Do NOT destructure `params` here; read from outer `args`
    const cartId = Number(args.params.id);
    if (!Number.isFinite(cartId)) throw new Response("Invalid cart id", { status: 400 });

    // Safety: ensure the cart belongs to this shop
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: cart, error: cartErr } = await supabase
      .from("carts")
      .select("id, shop, cart_create_date, cart_total_price, cart_item_count, cart_status")
      .eq("id", cartId)
      .single();
    if (cartErr || !cart || cart.shop !== shopId) throw new Response("Cart not found", { status: 404 });

    const [items, offer] = await Promise.all([
      getCartItemsForCart(shopId, cartId),
      getOfferForCart(shopId, cartId),
    ]);

    return json({ cartId, cart, items, offer });
  })(args);

/*
async function getCartMeta(shopId: number, cartId: number) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase
    .from("carts")
    .select("id, shop, cart_create_date, cart_total_price, cart_item_count, cart_status")
    .eq("id", cartId)
    .single();
  if (error) throw error;
  if (data.shop !== shopId) throw new Response("Cart not found", { status: 404 });
  return data;
}
// ---- /helpers

export const loader = withShopLoader(async ({ shopId, params }: {
  shopId: number;
  request: Request;
  params: { id?: string };
}) => {
  const cartId = Number(params.id);
  if (!Number.isFinite(cartId)) throw new Response("Invalid cart id", { status: 400 });

  const [cart, items, offer] = await Promise.all([
    getCartMeta(shopId, cartId),
    getCartItemsForCart(shopId, cartId),
    getOfferForCart(shopId, cartId),
  ]);

  return json({ cartId, cart, items, offer });
});
*/
type LoaderData = {
  cartId: number;
  cart: { id: number; cart_create_date: string | null; cart_total_price: number | null; cart_item_count: number | null; cart_status: string | null };
  items: CartItemRow[];
  offer: null | { id: number; status_code: string | null; created_at: string | null; discount_code: string | null; amount: number | null; consumer?: { id: number; first_name: string | null; last_name: string | null; email: string | null } | null };
};

export default function ReviewCart() {
  const { cartId, cart, items, offer } = useLoaderData<typeof loader>() as LoaderData;
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const rows = items.map((r, idx) => (
    <IndexTable.Row id={String(r.id)} key={r.id} position={idx}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">{r.created_date ? new Date(r.created_date).toLocaleString() : "-"}</Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {r.product_admin_url ? (
          <a href={r.product_admin_url} target="_blank" rel="noreferrer">{r.product_name ?? "View product"}</a>
        ) : (
          <Text as="span" variant="bodyMd">{r.product_name ?? "-"}</Text>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell><Text as="span" variant="bodyMd">{r.variant_sku ?? "-"}</Text></IndexTable.Cell>
      <IndexTable.Cell><Text as="span" variant="bodyMd">{r.variant_quantity ?? 0}</Text></IndexTable.Cell>
      <IndexTable.Cell><Text as="span" variant="bodyMd">{(r.variant_selling_price ?? 0).toString()}</Text></IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title={`Review Cart #${cartId}`}
      primaryAction={{ content: "Back to Carts", onAction: () => navigate(`/app/carts?${sp.toString()}`) }}
    >
      <Card>
        <Box padding="400">
          <InlineStack gap="400" align="space-between" blockAlign="center" wrap={false}>
            <Text as="h3" variant="headingMd">Cart Summary</Text>
            <Text as="span" variant="bodyMd">
              Items: {cart.cart_item_count ?? 0} • Total: {(cart.cart_total_price ?? 0).toString()} • Status: {cart.cart_status ?? "-"}
            </Text>
          </InlineStack>
        </Box>
        <IndexTable
          resourceName={{ singular: "item", plural: "items" }}
          itemCount={items.length}
          headings={[{ title: "Date" }, { title: "Product" }, { title: "SKU" }, { title: "Qty" }, { title: "Selling Price" }]}
          selectable={false}
        >
          {rows}
        </IndexTable>
      </Card>

      <Box padding="400">
        <Card>
          <Box padding="400">
            <Text as="h3" variant="headingMd">Offer</Text>
            <Text as="p" variant="bodyMd">
              {offer
                ? `#${offer.id} • ${offer.status_code ?? "-"} • ${offer.discount_code ?? ""} • ${offer.amount ?? 0}`
                : "No offers yet"}
            </Text>
            {offer?.consumer && (
              <Text as="p" variant="bodyMd">
                Consumer: {offer.consumer.first_name ?? ""} {offer.consumer.last_name ?? ""} • {offer.consumer.email ?? ""}
              </Text>
            )}
          </Box>
        </Card>
      </Box>
    </Page>
  );
}
