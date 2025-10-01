// app/routes/app.offers._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack, BlockStack, TextField,
  Select } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopOffers, type OfferRow } from "../lib/queries/supabase/getShopOffers";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getEnumsServer, type EnumMap } from "../lib/queries/supabase/getEnums.server";
import { useAppNavigate, useAppUrl } from "../utils/navigation";

type FilterState = {
  startDate: string;
  endDate: string;
  status: string;
  searchId: string;
};

type LoaderData = {
  offers: OfferRow[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  host?: string | null;
  statusOptions: Array<{ label: string; value: string }>;
  shopSession: {
    shopDomain: string;
    shopsId: number;
  };
};

// ---- Utils ----
const filterOffers = (offers: OfferRow[], filters: FilterState) => {
  const { startDate, endDate, status, searchId } = filters;

  return offers.filter((offer) => {
    // Status filter
    if (status && offer.offerStatus !== status) return false;

    // Date range filter
    if (startDate || endDate) {
      const offerDate = offer.createDate ? new Date(offer.createDate) : null;
      const fStart = startDate ? new Date(startDate) : null;
      const fEnd = endDate ? new Date(endDate) : null;

      if (fStart && offerDate && offerDate < fStart) return false;
      if (fEnd && offerDate && offerDate > fEnd) return false;
    }

    // Search by offer ID
    if (searchId) {
      const searchLower = searchId.toLowerCase();
      const offerId = offer.id?.toString().toLowerCase() || "";
      
      if (!offerId.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
};

// ---- Loader ----
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID, session } = await getAuthContext(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);
  const statusParam = url.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Offered", "Abandoned"];
  const host = url.searchParams.get("host");

  // Fetch offers and enums
  const [{ offers, count }, enums] = await Promise.all([
    getShopOffers(shopsID, {
      monthsBack,
      limit,
      page,
      statuses,
    }),
    getEnumsServer(),
  ]);

  const hasMore = page * limit < (count ?? 0);

  // Get status options from enum or from actual data
  const offerStatusEnum = 
    enums.offerstatus || 
    enums.offer_status || 
    enums.offerStatus || 
    [];

// Update the statusOptions creation in the loader
// Update the statusOptions creation in the loader
const statusOptions: Array<{ label: string; value: string }> = offerStatusEnum.length > 0
  ? [
      { label: "All Statuses", value: "" },
      ...offerStatusEnum
        .filter((v) => v != null && v !== "")
        .map((v) => ({ label: String(v), value: String(v) }))
    ]
  : [
      { label: "All Statuses", value: "" },
      ...Array.from(new Set(offers.map((o) => o.offerStatus)))
        .filter((v) => v != null )
        .sort()
        .map((v) => ({ label: String(v), value: String(v) }))
    ];

  return json<LoaderData>({
    offers,
    count: count ?? 0,
    hasMore,
    page,
    limit,
    host,
    statusOptions,
    shopSession: {
      shopDomain: session.shop,
      shopsId: shopsID,
    },
  });
};

// ---- Subcomponents ----
function FiltersCard({
  filters,
  onFilterChange,
  onClearFilters,
  statusOptions,
  resultCount,
  totalCount,
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  statusOptions: Array<{ label: string; value: string }>;
  resultCount: number;
  totalCount: number;
}) {
  const hasActiveFilters = Object.values(filters).some(Boolean);
  
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Filters</Text>

        <InlineStack gap="300" blockAlign="center" wrap={false}>
          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <TextField
              label="Search by Offer ID"
              value={filters.searchId}
              onChange={(v) => onFilterChange("searchId", v)}
              placeholder="Search offer ID..."
              autoComplete="off"
              clearButton
              onClearButtonClick={() => onFilterChange("searchId", "")}
            />
          </div>

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <TextField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(v) => onFilterChange("startDate", v)}
              autoComplete="off"
            />
          </div>

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <TextField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(v) => onFilterChange("endDate", v)}
              autoComplete="off"
            />
          </div>

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status}
              onChange={(v) => onFilterChange("status", v)}
            />
          </div>
        </InlineStack>

        {hasActiveFilters && (
          <InlineStack gap="200">
            <Button onClick={onClearFilters} variant="plain">
              Clear all filters
            </Button>
            <Text as="span" tone="subdued" variant="bodySm">
              Showing {resultCount} of {totalCount} offers
            </Text>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}

// ---- Main Component ----
export default function OffersIndex() {
  const { offers, count, hasMore, page, limit, host, statusOptions, shopSession } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useAppNavigate();
  const buildUrl = useAppUrl();
  const handleRowClick = (offer: OfferRow) => {
    navigate(`/app/offers/${offer.id}`);
  };

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    status: searchParams.get("filterStatus") || "", // Use filterStatus to avoid conflict with existing status param
    searchId: searchParams.get("search") || "",
  });

  const updateSearchParams = useCallback((next: FilterState) => {
    const params = new URLSearchParams(searchParams);
    
    // Update filter params
    if (next.startDate) params.set("startDate", next.startDate);
    else params.delete("startDate");
    
    if (next.endDate) params.set("endDate", next.endDate);
    else params.delete("endDate");
    
    if (next.status) params.set("filterStatus", next.status);
    else params.delete("filterStatus");
    
    if (next.searchId) params.set("search", next.searchId);
    else params.delete("search");
    
    // Keep existing params
    if (host) params.set("host", host);
    
    setSearchParams(params);
  }, [searchParams, host, setSearchParams]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      const next = { ...filters, [key]: value };
      setFilters(next);
      updateSearchParams(next);
    },
    [filters, updateSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    const empty: FilterState = { 
      startDate: "", 
      endDate: "", 
      status: "", 
      searchId: "" 
    };
    setFilters(empty);
    
    // Clear filter params but keep others
    const params = new URLSearchParams(searchParams);
    params.delete("startDate");
    params.delete("endDate");
    params.delete("filterStatus");
    params.delete("search");
    if (host) params.set("host", host);
    
    setSearchParams(params);
  }, [searchParams, host, setSearchParams]);

  // Apply client-side filtering
  const filteredOffers = useMemo(
    () => filterOffers(offers, filters),
    [offers, filters]
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  //Filtered table navigation
  const gotoPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (host) params.set("host", host);
    params.set("page", String(p));
    params.set("limit", String(limit));
    navigate(`/app/offers?${params.toString()}`);
  };


  return (
    <Page
      title="Customer Generated Offers"
      subtitle={`${count} total`}
    >
      <BlockStack gap="300">
        {/* Filters Card */}
        <FiltersCard
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          statusOptions={statusOptions}
          resultCount={filteredOffers.length}
          totalCount={count}
        />

        {/* Offers Table */}
        {filteredOffers.length > 0 ? (
          <Card>
            <IndexTable
              itemCount={filteredOffers.length}
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
              {filteredOffers.map((offer: OfferRow, index: number) => (
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
                      {formatDateTime(offer.createDate ?? "")}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">{offer.items ?? 0}</Text>
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
                      <Button onClick={() => navigate(`/app/offers/${offer.id}`)}>
                        Offer Details
                      </Button>
                    </div>         
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        ) : (
          <Card>
            <div style={{ padding: "var(--p-space-800)" }}>
              <BlockStack gap="200" align="center">
                <Text as="p" variant="bodyLg" alignment="center">
                  {hasActiveFilters 
                    ? "No offers match your filters" 
                    : "No offers found"
                  }
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  {offers.length === 0
                    ? "Customer offers will appear here once customers start making offers"
                    : hasActiveFilters
                      ? "Try adjusting your filters or clear them to see all offers"
                      : ""
                  }
                </Text>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="plain">
                    Clear filters to see all offers
                  </Button>
                )}
              </BlockStack>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {filteredOffers.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <InlineStack align="space-between" gap="400" blockAlign="center" wrap={false}>
              <Button disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
                Previous
              </Button>
              <Text as="span" variant="bodySm">
                Page {page} · Showing {filteredOffers.length} of {count}
                {hasActiveFilters && ` (${filteredOffers.length} filtered)`}
              </Text>
              <Button disabled={!hasMore} onClick={() => gotoPage(page + 1)}>
                Next
              </Button>
            </InlineStack>
          </div>
        )}
      </BlockStack>
    </Page>
  );
}



/*

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopOffers, type OfferRow } from "../lib/queries/supabase/getShopOffers";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server"

type LoaderData = {
  offers: OfferRow[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  host?: string | null;
  shopSession: {
    shopDomain: string;
    shopsId: number;
  };
}
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID, currentUserId, session} = await getAuthContext(request);
  const url = new URL(request.url);
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
  const { offers, count } = await getShopOffers(shopsID, {
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
    shopSession: {
      shopDomain: session.shop,
      shopsId: shopsID
    }
  });
};

export default function OffersIndex() {
  const { offers, count, hasMore, page, limit, host, shopSession } = useLoaderData<typeof loader>();
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
      title={`Customer Generated Offers `}
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
                  {formatDateTime(offer.createDate ?? "")}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{offer.items ?? 0}</Text>
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
                    Offer Details
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
  */