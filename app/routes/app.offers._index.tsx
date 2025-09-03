// app/routes/app.offers._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopOffers, type OfferRow } from "../lib/queries/getShopOffers";
import { useShopContext } from "../lib/hooks/useShopContext";

type LoaderData = {
  offers: OfferRow[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  host?: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Import and use the cached session
  const { requireCompleteShopSession } = await import("../lib/session/shopAuth.server");
  const { shopSession } = await requireCompleteShopSession(request);

  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);
  const statusParam = url.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Offered", "Abandoned"];
  const host = url.searchParams.get("host");

  // Use the cached shopsId for fast queries
  const { offers, count } = await getShopOffers(shopSession.shopsId, {
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
    host,
  });
};

/* Alternative loader that fetches data using cached session
export const loaderWithData = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Get cached session (no DB hit since parent layout already loaded it)
  const { requireCompleteShopSession } = await import("../lib/session/shopAuth.server");
  const { shopSession } = await requireCompleteShopSession(request);

  // Query params
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);

  const statusParam = url.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Offered", "Abandoned"];

  const host = url.searchParams.get("host");

  // Fast query using cached shopsId - no JOIN on shopDomain!
  const { offers, count } = await getShopOffers(shopSession.shopsId, {
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
    host,
  });
};
*/
export default function OffersIndex() {
  const { offers, count, hasMore, page, limit, host } = useLoaderData<typeof loader>();
  
  // Get session data from cached context - no additional DB queries!
  const { shopSession, shopsId, shopsBrandName } = useShopContext();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const makeDetailHref = (id: string | number) => {
    const params = new URLSearchParams(searchParams);
    // No need to manually add shop param - it's in the session context
    if (host) params.set("host", host);
    return `/app/offers/${id}?${params.toString()}`;
  };

  const gotoPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    // No need to manually add shop param - it's available via session
    if (host) params.set("host", host);
    params.set("page", String(p));
    params.set("limit", String(limit));
    navigate(`/app/offers?${params.toString()}`);
  };

  const handleRowClick = (offer: OfferRow) => {
    navigate(makeDetailHref(offer.id));
  };

  return (
    <Page
      title={`Customer Generated Offers - ${shopsBrandName}`}
      subtitle="Offers"
      primaryAction={<Text as="span" variant="bodyMd">{count} total</Text>}
    >
      {/* Debug info - remove in production */}
      <Card>
        <Text as="p" variant="bodyMd">
          Shop: {shopSession.shopDomain} | Shop ID: {shopsId} | Brand: {shopsBrandName}
        </Text>
      </Card>

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
          {offers.map((offer: OfferRow, index: number) => (
            <IndexTable.Row
              id={String(offer.id)}
              key={String(offer.id)}
              position={index}
              onClick={() => handleRowClick(offer)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offer.id}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatDateTime(offer.offerCreateDate ?? "")}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offer.offerItems ?? 0}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatCurrencyUSD(offer.cartTotalPrice ?? 0)}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offer.offerStatus ?? "unknown"}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button onClick={() => navigate(makeDetailHref(offer.id))}>
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