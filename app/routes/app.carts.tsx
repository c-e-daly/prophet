import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable } from "@shopify/polaris";
import { createClient } from "../utils/supabase/server";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getCartsByShop } from "../lib/queries/getShopCarts";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  if (!shop) return json({ shop: "", carts: [], count: 0, hasMore: false });

  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "50");
  const sinceMonths = url.searchParams.get("sinceMonths");
  const status = url.searchParams.get("status");

  const { data, count, hasMore, error } = await getCartsByShop(shop, {
    page,
    limit,
    sinceMonths: sinceMonths === null ? 6 : Math.max(0, Number(sinceMonths) || 0),
    status: status || undefined,
  });

  if (error) {
    console.error("Supabase carts error:", error);
    // You can choose to throw to ErrorBoundary; for now return empty w/ meta
  }

  return json({ shop, carts: data, count, hasMore, page, limit });
}


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
