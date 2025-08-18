import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable } from "@shopify/polaris";
import { supabaseServer } from "../lib/supabase/server";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";

type CartRow = {
  id: string | number;
  cart_create_date: string | null;     // timestamptz/string from DB
  cart_item_count: number | null;
  cart_total_price: number | null;     // cents
  cart_status: string | null;
};

type LoaderData = {
  shop: string;
  carts: CartRow[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  if (!shop) {
    // You can also redirect or throw here if shop is required
    return json<LoaderData>({ shop: "", carts: [] });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("carts")
    .select("id, cart_create_date, cart_item_count, cart_total_price, cart_status")
    .eq("shop", shop)
    .order("cart_create_date", { ascending: false });

  if (error) {
    // Log on server; don’t leak internals to client
    // eslint-disable-next-line no-console
    console.error("Supabase carts error:", error);
  }

  return json<LoaderData>({
    shop,
    carts: (data ?? []) as CartRow[],
  });
}

export default function Carts() {
  const { carts, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleRowClick = (cart: CartRow) => {
    navigate(`/app/carts/${cart.id}?shop=${encodeURIComponent(shop)}`);
  };

  return (
    <Page title="Carts">
      <Card>
        <IndexTable
          itemCount={carts.length}
          selectable={false}
          headings={[
            { title: "Cart ID" },
            { title: "Created At" },
            { title: "Items" },
            { title: "Total Price" },
            { title: "Status" },
            { title: "Actions" },
          ]}
        >
          {carts.map((cart, index) => (
            <IndexTable.Row
              id={String(cart.id)}
              key={String(cart.id)}
              position={index}
              onClick={() => handleRowClick(cart)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {cart.id}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatDateTime(cart.cart_create_date)}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {cart.cart_item_count ?? 0}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatCurrencyUSD(cart.cart_total_price)}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {cart.cart_status ?? "unknown"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <div onClick={(e) => e.stopPropagation()}>
                <Button
                 variant="plain"
                 onClick={() => handleRowClick(cart)}  // no event arg here
                >
                View
                </Button>
                </div>
            </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>
    </Page>
  );
}
