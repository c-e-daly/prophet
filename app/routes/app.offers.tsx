// app/routes/app.offers._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopOffers, type OfferRow } from "../lib/queries/getShopOffers";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";

type LoaderData = {
  offers: OfferRow[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  shop: string;
  host?: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // session + shop id
  const { shop } = await getShopFromSession(request);
  const shopsId = await getShopIdFromSupabase(shop);

  // query params
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);

  // status filter: default to Offered + Abandoned; allow comma-separated override
  const statusParam = url.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Offered", "Abandoned"];

  const host = url.searchParams.get("host");

  const { offers, count } = await getShopOffers(shopsId, {
    monthsBack,
    limit,
    page,
    statuses,
  });

  const hasMore = page * limit < (count ?? 0);

  return json<LoaderData>({
    offers,
    count: count ?? 0,
    hasMore,
    page,
    limit,
    shop,
    host,
  });
};

export default function OffersIndex() {
  const { offers, shop, host, count, hasMore, page, limit } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const makeDetailHref = (id: string | number) => {
    const params = new URLSearchParams(searchParams);
    params.set("shop", shop);
    if (host) params.set("host", host);
    return `/app/offers/${id}?${params.toString()}`;
  };

  const gotoPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("shop", shop);
    if (host) params.set("host", host);
    params.set("page", String(p));
    params.set("limit", String(limit));
    navigate(`/app/offers?${params.toString()}`);
  };

  const handleRowClick = (offers: OfferRow) => {
    navigate(makeDetailHref(offers.id));
  };

  return (
    <Page
      title="Customer Generated Offers"
      subtitle="Offers"
      primaryAction={<Text as="span" variant="bodyMd">{count} total</Text>}
    >
      <Card>
        <IndexTable
          itemCount={offers.length}
          selectable={false}
          headings={[
            { title: "Offer ID" },
            { title: "Created At" },
            { title: "Items" },
            { title: "Total Price" },
            { title: "Status" },
            { title: "Actions" },
          ]}
        >
          {offers.map((offers: OfferRow, index: number) => (
            <IndexTable.Row
              id={String(offers.id)}
              key={String(offers.id)}
              position={index}
              onClick={() => handleRowClick(offers)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offers.id}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatDateTime(offers.offerCreateDate ?? "")}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offers.offerItems ?? 0}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatCurrencyUSD(offers.cartTotalPrice ?? 0)}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offers.offerStatus ?? "unknown"}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button onClick={() => navigate(makeDetailHref(offers.id))}>
                    Review Cart
                  </Button>
                </div>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <div style={{ marginTop: 12 }}>
        {/* Avoid InlineStack `style` prop errors by wrapping in a div */}
        <InlineStack align="space-between" gap="400" blockAlign="center" wrap={false}>
          <Button disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
            Previous
          </Button>
          <Text as="span" variant="bodySm">
            Page {page} · Showing {offers.length} of {count}
          </Text>
          <Button disabled={!hasMore} onClick={() => gotoPage(page + 1)}>
            Next
          </Button>
        </InlineStack>
      </div>
    </Page>
  );
}
