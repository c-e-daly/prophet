// app/routes/app.campaigns._index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams, useSubmit } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge, TextField, Select, FormLayout } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import type { Tables, Enum} from "../lib/queries/types/dbTables"
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";
import { formatCurrencyUSD, formatDate, truncate } from "../utils/format";
import { CampaignStatusValues } from "../lib/queries/types/enumTypes";

type Campaign = Tables<"campaigns">;
type Program  = Tables<"programs">;

type LoaderData = {
  campaigns: Array<Campaign & { programs: Program[] }>;
  statusOptions: Array<{ label: string; value: string }>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get shop data from session
  const { shop } = await getShopFromSession(request); //get shop domain from session
  const shopsId = await getShopIdFromSupabase(shop);  // use session domain to get supabase shops.id
  const campaigns = await fetchCampaignsWithPrograms(shopsId); // pass shops.id to get campaigns & programs
  
  const statusOptions = [
    { label: "All Statuses", value: "" },
    ...CampaignStatusValues.map((status) => ({ label: status, value: status }))
  ];
  
  return json<LoaderData>({ campaigns, statusOptions });
};

export default function CampaignsIndex() {
  const { campaigns, statusOptions } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter state
  const [startDateFilter, setStartDateFilter] = useState(searchParams.get("startDate") || "");
  const [endDateFilter, setEndDateFilter] = useState(searchParams.get("endDate") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  // Update URL params when filters change
  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDateFilter(value);
    updateFilters({ startDate: value, endDate: endDateFilter, status: statusFilter });
  }, [endDateFilter, statusFilter, updateFilters]);

  const handleEndDateChange = useCallback((value: string) => {
    setEndDateFilter(value);
    updateFilters({ startDate: startDateFilter, endDate: value, status: statusFilter });
  }, [startDateFilter, statusFilter, updateFilters]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    updateFilters({ startDate: startDateFilter, endDate: endDateFilter, status: value });
  }, [startDateFilter, endDateFilter, updateFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStartDateFilter("");
    setEndDateFilter("");
    setStatusFilter("");
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Filter campaigns based on current filters
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      // Status filter
      if (statusFilter && campaign.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (startDateFilter || endDateFilter) {
        const campaignStart = campaign.startDate ? new Date(campaign.startDate) : null;
        const campaignEnd = campaign.endDate ? new Date(campaign.endDate) : null;
        const filterStart = startDateFilter ? new Date(startDateFilter) : null;
        const filterEnd = endDateFilter ? new Date(endDateFilter) : null;

        // Check if campaign overlaps with filter date range
        if (filterStart && campaignEnd && campaignEnd < filterStart) {
          return false; // Campaign ends before filter starts
        }
        if (filterEnd && campaignStart && campaignStart > filterEnd) {
          return false; // Campaign starts after filter ends
        }
      }

      return true;
    });
  }, [campaigns, statusFilter, startDateFilter, endDateFilter]);

  const getStatusBadgeTone = (status: string) => {
    switch (status) {
      case "Active":
        return "success" as const;
      case "Archived":
        return "info" as const;
      case "Draft":
        return "attention" as const;
      default:
        return "attention" as const;
    }
  };

  const hasActiveFilters = statusFilter || startDateFilter || endDateFilter;
  
  return (
    <Page
      title="Campaigns"
      primaryAction={
        <Button
          url="/app/campaigns/create"
          variant="primary"
        >
          Create Campaign
        </Button>
      }
    >
      <BlockStack gap="500">
        {/* Filters Card */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Filters
            </Text>
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDateFilter}
                  onChange={handleStartDateChange}
                  autoComplete="off"
                  helpText="Show campaigns that start on or after this date"
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDateFilter}
                  onChange={handleEndDateChange}
                  autoComplete="off"
                  helpText="Show campaigns that end on or before this date"
                />
                <Select
                  label="Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={handleStatusChange}
                />
              </FormLayout.Group>
            </FormLayout>
            {hasActiveFilters && (
              <InlineStack gap="200">
                <Button onClick={clearFilters} variant="plain">
                  Clear all filters
                </Button>
                <Text as="span" tone="subdued" variant="bodySm">
                  Showing {filteredCampaigns.length} of {campaigns.length} campaigns
                </Text>
              </InlineStack>
            )}
          </BlockStack>
        </Card>

        {/* Campaigns Table */}
        <Card>
          <IndexTable
            resourceName={{ singular: "campaign", plural: "campaigns" }}
            itemCount={filteredCampaigns.length}
            headings={[
              { title: "Campaign Name" },
              { title: "Code Prefix" },
              { title: "Status" },
              { title: "Start Date" },
              { title: "End Date" },
              { title: "Budget" },
              { title: "Programs" },
            ]}
            selectable={false}
          >
            {filteredCampaigns.map(
              (c: Campaign & { programs: Program[] }, index: number) => (
                <IndexTable.Row id={String(c.id)} key={c.id} position={index}>
                  <IndexTable.Cell>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      <Link to={`/app/campaigns/${c.id}`}>
                        {c.campaignName}
                      </Link>
                    </Text>
                    {c.description && (
                      <Text as="p" tone="subdued" variant="bodySm">
                        {truncate(c.description, 60)}
                      </Text>
                    )}
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {c.codePrefix || "—"}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Badge tone={getStatusBadgeTone(c.status)}>
                      {c.status}
                    </Badge>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {c.startDate ? formatDate(c.startDate) : "—"}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {c.endDate ? formatDate(c.endDate) : "—"}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {c.budget != null ? formatCurrencyUSD(c.budget) : "—"}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <InlineStack gap="100" align="center">
                      <Text as="span" variant="bodyMd">
                        {c.programs.length}
                      </Text>
                      {c.programs.length > 0 && (
                        <Text as="span" tone="subdued" variant="bodySm">
                          program{c.programs.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </InlineStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              )
            )}
          </IndexTable>
          
          {filteredCampaigns.length === 0 && (
            <div style={{ padding: "var(--p-space-800)" }}>
              <BlockStack gap="200" align="center">
                <Text as="p" variant="bodyLg" alignment="center">
                  {hasActiveFilters ? "No campaigns match your filters" : "No campaigns found"}
                </Text>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="plain">
                    Clear filters to see all campaigns
                  </Button>
                )}
              </BlockStack>
            </div>
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}

/*// app/routes/app.campaigns._index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge } from "@shopify/polaris";
import type { Tables, Enum} from "../lib/queries/types/dbTables"
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";
import { formatCurrencyUSD, formatDate, truncate } from "../utils/format";

type Campaign = Tables<"campaigns">;
type Program  = Tables<"programs">;

type LoaderData = {
  campaigns: Array<Campaign & { programs: Program[] }>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get shop data from session
  const { shop } = await getShopFromSession(request); //get shop domain from session
  const shopsId = await getShopIdFromSupabase(shop);  // use session domain to get supabase shops.id
  const campaigns = await fetchCampaignsWithPrograms(shopsId); // pass shops.id to get campaigns & programs
  
  return json<LoaderData>({ campaigns });
};

export default function CampaignsIndex() {
  const { campaigns } = useLoaderData<typeof loader>();

  
  return (
    <Page
      title="Campaigns"
      primaryAction={
        <Button
          url="/app/campaigns/create"
          variant="primary"
        >
          Create Campaign
        </Button>
      }
    >
      <BlockStack gap="500">
        <Card>
          <IndexTable
            resourceName={{ singular: "campaign", plural: "campaigns" }}
            itemCount={campaigns.length}
            headings={[
              { title: "Name" },
              { title: "Status" },
              { title: "Dates" },
              { title: "Programs" },
              { title: "Budget" },
            ]}
            selectable={false}
          >
            {campaigns.map(
              (c: Campaign & { programs: Program[] }, index: number) => (
                <IndexTable.Row id={String(c.id)} key={c.id} position={index}>
                  <IndexTable.Cell>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        <Link to={`/app/campaigns/${c.id}`}>
                          {c.campaignName}
                        </Link>
                      </Text>
                      {c.description ? (
                        <Text as="p" tone="subdued">
                          {truncate(c.description, 120)}
                        </Text>
                      ) : null}
                      {c.codePrefix ? (
                        <Text as="span" tone="subdued">
                          Code Prefix: {c.codePrefix}
                        </Text>
                      ) : null}
                    </BlockStack>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Badge tone={c.status === "Active" ? "success" : "attention"}>
                      {c.status}
                    </Badge>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span">
                      {formatDate(c.startDate)} — {formatDate(c.endDate)}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <InlineStack gap="200" wrap>
                      {c.programs.length > 0 ? (
                        c.programs.map((p: Program) => (
                          <div
                            key={p.id}
                            style={{
                              border: "1px solid var(--p-color-border, #E3E3E3)",
                              padding: "var(--p-space-050, 4px) var(--p-space-200, 8px)",
                              borderRadius: 6,
                            }}
                          >
                            <Text as="span" variant="bodySm">
                              <Link to={`/app/campaigns/programs/${p.id}`}>
                                {p.programName}
                              </Link>
                            </Text>
                            <br />
                            <Text as="span" tone="subdued" variant="bodySm">
                              {p.programFocus ?? "—"} · {p.status}
                            </Text>
                          </div>
                        ))
                      ) : (
                        <Text as="span" tone="subdued">
                          No programs
                        </Text>
                      )}
                    </InlineStack>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span">
                      {c.budget != null ? formatCurrencyUSD(c.budget) : "—"}
                    </Text>
                  </IndexTable.Cell>
                </IndexTable.Row>
              )
            )}
          </IndexTable>
        </Card>
      </BlockStack>
    </Page>
  );
}

*/