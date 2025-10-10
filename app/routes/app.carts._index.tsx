// app/routes/app.carts._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack, BlockStack, Select,
  TextField } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopCarts } from "../lib/queries/supabase/getShopCarts";
import {type CartRow , CartStatusEnum, CartStatusType} from '../lib/types/dbTables'
import { getAuthContext } from "../lib/auth/getAuthContext.server"

type FilterState = {
  startDate: string;
  endDate: string;
  status: string;
  searchId: string;
};

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

// ---- Utils ----
const filterCart = (carts: CartRow[], filters: FilterState) => {
  const { startDate, endDate, status, searchId } = filters;

  return carts.filter((carts) => {
    // Status filter
    if (status && carts.cartStatus !== status) return false;

    // Date range filter
    if (startDate || endDate) {
      const createDate = carts.createDate ? new Date(carts.createDate) : null;
      const fStart = startDate ? new Date(startDate) : null;
      const fEnd = endDate ? new Date(endDate) : null;

      if (fStart && createDate && createDate < fStart) return false;
      if (fEnd && createDate && createDate > fEnd) return false;
    }

    // Search by offer ID
    if (searchId) {
      const searchLower = searchId.toLowerCase();
      const cartsID = carts.id?.toString().toLowerCase() || "";
      
      if (!cartsID.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
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

  const { carts, count } = await getShopCarts(
    shopsID, 
    { monthsBack, 
      limit, 
      page, 
      statuses, 
    });
  const total = count ?? 0;
  const hasMore = page * limit < total;
  console.log(shopsID, monthsBack, limit, page, statuses);
  
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


export default function CartsIndex() {
  const { carts, host, count, hasMore, page, limit, statusOptions} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
  const filteredCarts = useMemo(
    () => filterCart(carts, filters),
    [carts, filters]
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <Page
      title={`Abandoned Carts`}
      subtitle="Carts with active offers that haven't converted yet"
      primaryAction={<Text as="span" variant="bodyMd">{count} total</Text>}
    >
        <BlockStack gap="300">
         
          <FiltersCard
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            statusOptions={statusOptions}
            resultCount={filteredCarts.length}
            totalCount={count}
          />
          </BlockStack>
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