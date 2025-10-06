// app/routes/app.pricebuilder._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack, BlockStack,
  TextField, Select, Badge, Box } from "@shopify/polaris";
import { useMemo, useState, useEffect } from "react";
import { useIndexResourceState } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";
import { getShopProductVariants, VariantRow } from "../lib/queries/supabase/getShopProductVariants";
import { ShopifyLink } from "../utils/ShopifyLink";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

type LoaderData = {
  variants: VariantRow[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  shopSession: {
    shopDomain: string;
    shopsID: number;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID, session } = await getAuthContext(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const { variants, count } = await getShopProductVariants(shopsID, { limit, page });
  const total = count ?? 0;
  const hasMore = page * limit < total;

  return json({
    variants,
    count: total,
    hasMore,
    page,
    limit,
    shopSession: { shopDomain: session.shop, shopsID },
  });
};

type FilterState = {
  search: string;
  createdStart: string;   // yyyy-mm-dd
  createdEnd: string;     // yyyy-mm-dd
  status: "" | "draft" | "published";
  publishedStart: string; // yyyy-mm-dd
  publishedEnd: string;   // yyyy-mm-dd
};

function FiltersCard({
  filters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
}) {
  const hasActive = Object.values(filters).some(Boolean);

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Filters</Text>

        <InlineStack gap="300" blockAlign="center" wrap>
          <div style={{ flex: "1 1 30%", minWidth: 260 }}>
            <TextField
              label="Search (product title or variant name)"
              value={filters.search}
              onChange={(v) => onFilterChange("search", v)}
              placeholder="Search..."
              autoComplete="off"
              clearButton
              onClearButtonClick={() => onFilterChange("search", "")}
            />
          </div>

          <div style={{ flex: "1 1 20%", minWidth: 180 }}>
            <TextField
              label="Created start"
              type="date"
              value={filters.createdStart}
              onChange={(v) => onFilterChange("createdStart", v)}
              autoComplete="off"
            />
          </div>
          <div style={{ flex: "1 1 20%", minWidth: 180 }}>
            <TextField
              label="Created end"
              type="date"
              value={filters.createdEnd}
              onChange={(v) => onFilterChange("createdEnd", v)}
              autoComplete="off"
            />
          </div>

          <div style={{ flex: "1 1 20%", minWidth: 180 }}>
            <Select
              label="Status"
              options={[
                { label: "All", value: "" },
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ]}
              value={filters.status}
              onChange={(v) => onFilterChange("status", v)}
            />
          </div>

          <div style={{ flex: "1 1 20%", minWidth: 180 }}>
            <TextField
              label="Published start"
              type="date"
              value={filters.publishedStart}
              onChange={(v) => onFilterChange("publishedStart", v)}
              autoComplete="off"
            />
          </div>
          <div style={{ flex: "1 1 20%", minWidth: 180 }}>
            <TextField
              label="Published end"
              type="date"
              value={filters.publishedEnd}
              onChange={(v) => onFilterChange("publishedEnd", v)}
              autoComplete="off"
            />
          </div>
        </InlineStack>

        <InlineStack gap="200" align="space-between">
          <Button onClick={onClearFilters} variant="plain" disabled={!hasActive}>
            Clear all filters
          </Button>
          <Text as="span" tone="subdued" variant="bodySm">
            Showing {resultCount} of {totalCount} variants
          </Text>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

export default function PriceBuilderIndex() {
  const { variants, count, hasMore, page, limit } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ success: boolean }>();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    createdStart: "",
    createdEnd: "",
    status: "",
    publishedStart: "",
    publishedEnd: "",
  });

  const onFilterChange = (key: keyof FilterState, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const onClearFilters = () =>
    setFilters({ search: "", createdStart: "", createdEnd: "", status: "", publishedStart: "", publishedEnd: "" });

  const filtered = useMemo(() => {
    return variants.filter((v) => {
      const pricing = v.variantPricing;
      const titleMatch = (v.name ?? "").toLowerCase().includes(filters.search.toLowerCase());
      const searchOk = !filters.search || titleMatch;
      const createdIso = pricing?.createDate || v.createDate;
      const created = createdIso ? new Date(createdIso) : null;
      const createdStartOk = !filters.createdStart || (created && created >= new Date(filters.createdStart));
      const createdEndOk = !filters.createdEnd || (created && created <= new Date(filters.createdEnd + "T23:59:59"));

      const isPublished = Boolean(pricing?.isPublished);
      const statusOk =
        !filters.status ||
        (filters.status === "published" && isPublished) ||
        (filters.status === "draft" && !isPublished);

      const publishedIso = pricing?.publishedDate;
      const pub = publishedIso ? new Date(publishedIso) : null;
      const pubStartOk = !filters.publishedStart || (pub && pub >= new Date(filters.publishedStart));
      const pubEndOk = !filters.publishedEnd || (pub && pub <= new Date(filters.publishedEnd + "T23:59:59"));

      return searchOk && createdStartOk && createdEndOk && statusOk && pubStartOk && pubEndOk;
    });
  }, [variants, filters]);

  const bulkeditor = `/app/pricebuilder/bulkeditor`;
  const resourceName = { singular: "variant", plural: "variants" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filtered);

 const onBulkEdit = () => {
  const variantIds = selectedResources.map(id => parseInt(id, 10));
  fetcher.submit(
    { 
      _action: "store_selection",
      variantIds: JSON.stringify(variantIds) 
    },
    { method: "post", action: "/app/pricebuilder/bulkeditor" }
  );
  console.log("[PriceBuilder] bulk edit selection:", selectedResources);
};

/*   useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      navigate("/app/pricebuilder/bulkeditor");
    }
  }, [fetcher.state, fetcher.data, navigate]);*/


  return (
    <Page
      title="Price Builder"
      subtitle="Manage pricing for your product variants"
      primaryAction={<Text as="span" variant="bodyMd">{count} total variants</Text>}
    >
      <Box paddingBlockEnd="300">
        <FiltersCard
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          resultCount={filtered.length}
          totalCount={count}
        />
      </Box>

      {/* Simplified bulk actions - just the button */}
      {selectedResources.length > 0 && (
        <Box paddingBlockEnd="200">
          <InlineStack align="end">        
            <Button 
              variant="primary" 
              onClick={onBulkEdit}
              loading={fetcher.state !== "idle"}
            >
          Bulk Edit: {allResourcesSelected ? 'All' : selectedResources.length.toString() } items
            </Button>
          </InlineStack>
        </Box>
      )}

      <Card>
        <IndexTable
          resourceName={resourceName}
          itemCount={filtered.length}
          selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Variant" },
            { title: "SKU" },
            { title: "Shop Price" },
            { title: "Published Price" },
            { title: "Price Published" },
            { title: "Status" },
            { title: "Actions" },
          ]}
        >
          {filtered.map((variant, index) => {
            const pricing = variant.variantPricing;
            const status = pricing?.isPublished ? "published" : "draft";

            return (
              <IndexTable.Row
                id={String(variant.id)}
                key={variant.id}
                selected={selectedResources.includes(String(variant.id))}
                position={index}
              >
                <IndexTable.Cell>
                  <Text as="span" tone="subdued" variant="bodySm">
                    {variant.name}
                  </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {variant.variantSKU || "—"}
                  </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {formatCurrencyUSD(variant.shopifyPrice ?? 0)}
                  </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {pricing?.publishedPrice ? formatCurrencyUSD(pricing.publishedPrice) : "—"}
                  </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {pricing?.publishedDate ? formatDateTime(pricing.publishedDate) : "—"}
                  </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Badge tone={status === "published" ? "success" : "attention"}>
                    {status}
                  </Badge>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ShopifyLink to={`/app/pricebuilder/${variant.id}`}>
                      <Button>Edit Pricing</Button>
                    </ShopifyLink>
                  </div>
                </IndexTable.Cell>
              </IndexTable.Row>
            );
          })}
        </IndexTable>
      </Card>

      <Box paddingBlockStart="300">
        <InlineStack align="space-between" gap="400" blockAlign="center" wrap={false}>
          <ShopifyLink to={`/app/pricebuilder?page=${page - 1}&limit=${limit}`}>
            <Button disabled={page <= 1}>Previous</Button>
          </ShopifyLink>
          <Text as="span" variant="bodySm">
            Page {page} · Showing {filtered.length} of {count}
          </Text>
          <ShopifyLink to={`/app/pricebuilder?page=${page + 1}&limit=${limit}`}>
            <Button disabled={!hasMore}>Next</Button>
          </ShopifyLink>
        </InlineStack>
      </Box>
    </Page>
  );
}