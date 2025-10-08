// app/routes/app.carts._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopCarts } from "../lib/queries/supabase/getShopCarts";
import {type CartRow , CartStatusEnum, CartStatusType} from '../lib/types/dbTables'
import { getAuthContext } from "../lib/auth/getAuthContext.server"


type LoaderData = {
  carts: CartRow[];
  statusOptions: Array<{ label: string; value: string }>;
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  host?: string | null;
  shopSession: {
    shopDomain: string;
    shopsID: number;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID, currentUserId, session} = await getAuthContext(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);
  const statusParam = url.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean) as CartStatusType[] :
     [CartStatusEnum.Abandoned, CartStatusEnum.Checkout] as  CartStatusType[];
  const host = url.searchParams.get("host");

  const { carts, count } = await getShopCarts(shopsID, { monthsBack, limit, page, statuses });
  const total = count ?? 0;
  const hasMore = page * limit < total;

  const statusOptions: Array<{ label: string; value: string }> = [
   { label: "All Statuses", value: "" },
   ...Object.values(CartStatusEnum).map((status) => ({
     label: status,
     value: status,
   })),
  ]
 console.log('[Carts Index Loader] Result:', {
    cartsLength: carts.length,
    count
  });

  return json<LoaderData>({
    carts,
    count: total,
    statusOptions,
    hasMore,
    page,
    limit,
    host,
    shopSession: {
      shopDomain: session.shop,
      shopsID: shopsID,
    },
  });
};



export default function CartsIndex() {
  const { carts, host, count, hasMore, page, limit, shopSession } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const makeDetailHref = (id: string | number) => {
    const params = new URLSearchParams(searchParams);
    if (host) params.set("host", host);
    const query = params.toString();
    return `/app/carts/${id}${query ? `?${query}` : ""}`;
  };

  const gotoPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (host) params.set("host", host);
    params.set("page", String(p));
    params.set("limit", String(limit));
    navigate(`/app/carts?${params.toString()}`);
  };

  const handleRowClick = (cart: CartRow) => navigate(makeDetailHref(cart.id));

  return (
    <Page
      title={`Abandoned Carts`}
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
          {carts.map((cart, index) => (
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
                  {formatDateTime(cart.createDate ?? "")}
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