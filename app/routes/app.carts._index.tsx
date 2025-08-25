// app/routes/app.carts.tsx
import * as React from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopCarts } from "../lib/queries/getShopCarts";
import type { CartRow } from "../lib/queries/getShopCarts";
import { withShopLoader } from "../lib/queries/withShopLoader";


/* ---------- Types ---------- */

type CartsLoaderData = {
  shop: string;
  host: string | null;
  carts: CartRow[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
};

export const loader = withShopLoader(async ({
  request,
  shopId,
}: {
  request: LoaderFunctionArgs["request"];
  shopId: number;
}) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  const host = url.searchParams.get("host");

  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);

  const { carts, count } = await getShopCarts(shopId, { monthsBack, limit, page });
  const hasMore = page * limit < (count ?? 0);

  return json<CartsLoaderData>({
    shop,
    host,
    carts: carts ?? [],
    count: count ?? 0,
    hasMore,
    page,
    limit,
  });
});

/* ---------- Component ---------- */

export default function CartsIndex() {
  const { carts, shop, host, count, hasMore, page, limit } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const makeDetailHref = (id: string | number) => {
    const params = new URLSearchParams(searchParams);
    params.set("shop", shop);
    if (host) params.set("host", host);
    return `/app/carts/${id}?${params.toString()}`;
  };

  const gotoPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("shop", shop);
    if (host) params.set("host", host);
    params.set("page", String(p));
    params.set("limit", String(limit));
    navigate(`/app/carts?${params.toString()}`);
  };

  const handleRowClick = (cart: CartRow) => {
    navigate(makeDetailHref(cart.id));
  };

  return (
    <Page
      title="Abandoned Offers"
      subtitle="Carts with active offers that haven't converted yet"
      primaryAction={<Text as="span" variant="bodyMd">{count} total</Text>}
    >
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
          {carts.map((cart: CartRow, index: number) => (
            <IndexTable.Row
              id={String(cart.id)}
              key={String(cart.id)}
              position={index}
              onClick={() => handleRowClick(cart)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{cart.id}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatDateTime(cart.cartCreateDate ?? "")}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{cart.cartItemCount ?? 0}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatCurrencyUSD(cart.cartTotalPrice ?? 0)}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{cart.cartStatus ?? "unknown"}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button onClick={() => navigate(makeDetailHref(cart.id))}>
                    Review Cart
                  </Button>
                </div>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <div style={{ marginTop: 12 }}>
        <InlineStack align="space-between" gap="400" blockAlign="center" wrap={false}>
          <Button disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
            Previous
          </Button>
          <Text as="span" variant="bodySm">
            Page {page} · Showing {carts.length} of {count}
          </Text>
          <Button disabled={!hasMore} onClick={() => gotoPage(page + 1)}>
            Next
          </Button>
        </InlineStack>
      </div>
    </Page>
  );
}
