// app/routes/app.offers.counter._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack, BlockStack, TextField, Select } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getCounterOffers } from "../lib/queries/supabase/getShopCounterOffers";
import { useAppNavigate, useAppUrl } from "../utils/navigation";

/** Local view-model type for rows returned by getCounterOffers */
type CounterRow = {
  id: number;                // counterOffers.id
  offers?: { id?: number } | null;
  offerId?: number;          // derived (offers.id)
  offerStatus?: string | null;
  createDate?: string | null;
  consumerEmail?: string | null; // mapped in getCounterOffers
  consumerName?: string | null;  // mapped in getCounterOffers
  cartTotalPrice?: number | null; // from offers
};

/** The statuses that belong on this page */
const COUNTER_STATUSES = [
  "Reviewed Countered",
  "Consumer Accepted",
  "Consumer Declined",
  "Counter Accepted Expired",
  "Countered Withdrawn",
  "Requires Approval",
  "Consumer Countered",
  "Declined Consumer Counter",
  "Accepted Consumer Counter",
] as const;

type FilterState = {
  startDate: string;
  endDate: string;
  status: string;
  searchId: string; // search by Offer ID
};

type LoaderData = {
  rows: CounterRow[];
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
const filterRows = (rows: CounterRow[], filters: FilterState) => {
  const { startDate, endDate, status, searchId } = filters;

  return rows.filter((row) => {
    // Status filter — prefer offerStatus if present
    if (status) {
      const st = (row.offerStatus ?? "").toString();
      if (st !== status) return false;
    }

    // Date range filter uses counterOffers.createDate
    if (startDate || endDate) {
      const rowDate = row.createDate ? new Date(row.createDate) : null;
      const fStart = startDate ? new Date(startDate) : null;
      const fEnd = endDate ? new Date(endDate) : null;

      if (fStart && rowDate && rowDate < fStart) return false;
      if (fEnd && rowDate && rowDate > fEnd) return false;
    }

    // Search by **Offer ID** (parent offer id)
    if (searchId) {
      const searchLower = searchId.toLowerCase();
      const offerIdStr = (row.offerId ?? row.offers?.id ?? "").toString().toLowerCase();
      if (!offerIdStr.includes(searchLower)) return false;
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
  const host = url.searchParams.get("host");

  // Pull counter offers
  const data = await getCounterOffers(shopsID, {
    monthsBack,
    limit,
    page,
    // (optional) you can also pass statuses here if/when you add filtering in the query
    // statuses: COUNTER_STATUSES
  });

  // Normalize shape for UI
  const rows: CounterRow[] = (data || []).map((co: any) => ({
    ...co,
    offerId: co.offers?.id ?? undefined,
    cartTotalPrice: co.offers?.cartTotalPrice ?? null,
  }));

  const count = rows.length; // if you later return count from the query, swap this
  const hasMore = rows.length === limit; // cheap heuristic until count is available

  const statusOptions: Array<{ label: string; value: string }> = [
    { label: "All Statuses", value: "" },
    ...COUNTER_STATUSES.map((s) => ({ label: s, value: s })),
  ];

  return json<LoaderData>({
    rows,
    count,
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

// ---- Filters Card (reused pattern) ----
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
              Showing {resultCount} of {totalCount} counter offers
            </Text>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}

// ---- Main Component ----
export default function CounterOffersIndex() {
  const { rows, count, hasMore, page, limit, host, statusOptions } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useAppNavigate();
  const buildUrl = useAppUrl();

  const goToDetails = (offerId?: number) => {
    if (!offerId) return;
    navigate(`/app/offers/counter/${offerId}`);
  };

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    status: searchParams.get("filterStatus") || "",
    searchId: searchParams.get("search") || "",
  });

  const updateSearchParams = useCallback((next: FilterState) => {
    const params = new URLSearchParams(searchParams);

    // Update filter params
    next.startDate ? params.set("startDate", next.startDate) : params.delete("startDate");
    next.endDate ? params.set("endDate", next.endDate) : params.delete("endDate");
    next.status ? params.set("filterStatus", next.status) : params.delete("filterStatus");
    next.searchId ? params.set("search", next.searchId) : params.delete("search");

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
    const empty: FilterState = { startDate: "", endDate: "", status: "", searchId: "" };
    setFilters(empty);

    const params = new URLSearchParams(searchParams);
    params.delete("startDate");
    params.delete("endDate");
    params.delete("filterStatus");
    params.delete("search");
    if (host) params.set("host", host);

    setSearchParams(params);
  }, [searchParams, host, setSearchParams]);

  // Apply client-side filtering
  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Pagination
  const gotoPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (host) params.set("host", host);
    params.set("page", String(p));
    params.set("limit", String(limit));
    navigate(`/app/offers/counter?${params.toString()}`);
  };

  return (
    <Page title="Counter Offers" subtitle={`${count} total`}>
      <BlockStack gap="300">
        {/* Filters Card */}
        <FiltersCard
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          statusOptions={statusOptions}
          resultCount={filteredRows.length}
          totalCount={count}
        />

        {/* Counter Offers Table */}
        {filteredRows.length > 0 ? (
          <Card>
            <IndexTable
              itemCount={filteredRows.length}
              selectable={false}
              headings={[
                { title: "Offer ID" },
                { title: "Created At" },
                { title: "Offer Total" },
                { title: "Status" },
                { title: "Actions" },
              ]}
            >
              {filteredRows.map((row, index) => (
                <IndexTable.Row
                  id={String(row.id)}
                  key={String(row.id)}
                  position={index}
                  onClick={() => goToDetails(row.offerId)}
                >
                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">{row.offerId ?? "—"}</Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {formatDateTime(row.createDate ?? "")}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {formatCurrencyUSD(row.cartTotalPrice ?? 0)}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">{row.offerStatus ?? "unknown"}</Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button onClick={() => goToDetails(row.offerId)}>
                        Counter Details
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
                  {hasActiveFilters ? "No counter offers match your filters" : "No counter offers found"}
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  {rows.length === 0
                    ? "When counter offers are created, they’ll appear here."
                    : hasActiveFilters
                      ? "Try adjusting your filters or clear them to see all counter offers"
                      : ""}
                </Text>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="plain">
                    Clear filters to see all counter offers
                  </Button>
                )}
              </BlockStack>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <InlineStack align="space-between" gap="400" blockAlign="center" wrap={false}>
              <Button disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
                Previous
              </Button>
              <Text as="span" variant="bodySm">
                Page {page} · Showing {filteredRows.length} of {count}
                {hasActiveFilters && ` (${filteredRows.length} filtered)`}
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
