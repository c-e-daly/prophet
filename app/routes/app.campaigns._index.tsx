// app/routes/app.campaigns._index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  IndexTable,
  Badge,
  TextField,
  Select,
  Box
} from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import type { Tables } from "../lib/queries/types/dbTables";
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";
import { formatDate } from "../utils/format";
import { ProgramStatusValues } from "../lib/queries/types/enumTypes";

type Campaign = Tables<"campaigns">;
type Program = Tables<"programs">;

type ProgramWithCampaign = Program & {
  campaign: Pick<Campaign, "id" | "campaignName" | "startDate" | "endDate" | "status">;
};

type LoaderData = {
  programs: ProgramWithCampaign[];
  statusOptions: Array<{ label: string; value: string }>;
  campaignOptions: Array<{ label: string; value: string }>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop } = await getShopFromSession(request);
  const shopsId = await getShopIdFromSupabase(shop);
  const campaigns = await fetchCampaignsWithPrograms(shopsId);

  // Flatten to program-centric list (include campaign id for filtering/linking)
  const programs: ProgramWithCampaign[] = campaigns.flatMap((campaign) =>
    campaign.programs.map((program) => ({
      ...program,
      campaign: {
        id: campaign.id,
        campaignName: campaign.campaignName,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
      },
    }))
  );

  // Build unique campaign dropdown options from results
  const uniqueCampaignsMap = new Map<number, string>();
  for (const p of programs) {
    if (p.campaign?.id && !uniqueCampaignsMap.has(p.campaign.id)) {
      uniqueCampaignsMap.set(p.campaign.id, p.campaign.campaignName || `Campaign ${p.campaign.id}`);
    }
  }
  const campaignOptions = [
    { label: "All Campaigns", value: "" },
    ...Array.from(uniqueCampaignsMap.entries()).map(([id, name]) => ({
      label: name,
      value: String(id),
    })),
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    ...ProgramStatusValues.map((status) => ({ label: status, value: status })),
  ];

  return json<LoaderData>({ programs, statusOptions, campaignOptions });
};

export default function CampaignsIndex() {
  const { programs, statusOptions, campaignOptions } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters: program start/end, program status, campaign dropdown
  const [startDateFilter, setStartDateFilter] = useState(searchParams.get("startDate") || "");
  const [endDateFilter, setEndDateFilter] = useState(searchParams.get("endDate") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [campaignIdFilter, setCampaignIdFilter] = useState(searchParams.get("campaignId") || "");

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDateFilter(value);
    updateFilters({ startDate: value, endDate: endDateFilter, status: statusFilter, campaignId: campaignIdFilter });
  }, [endDateFilter, statusFilter, campaignIdFilter, updateFilters]);

  const handleEndDateChange = useCallback((value: string) => {
    setEndDateFilter(value);
    updateFilters({ startDate: startDateFilter, endDate: value, status: statusFilter, campaignId: campaignIdFilter });
  }, [startDateFilter, statusFilter, campaignIdFilter, updateFilters]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    updateFilters({ startDate: startDateFilter, endDate: endDateFilter, status: value, campaignId: campaignIdFilter });
  }, [startDateFilter, endDateFilter, campaignIdFilter, updateFilters]);

  const handleCampaignChange = useCallback((value: string) => {
    setCampaignIdFilter(value);
    updateFilters({ startDate: startDateFilter, endDate: endDateFilter, status: statusFilter, campaignId: value });
  }, [startDateFilter, endDateFilter, statusFilter, updateFilters]);

  const clearFilters = useCallback(() => {
    setStartDateFilter("");
    setEndDateFilter("");
    setStatusFilter("");
    setCampaignIdFilter("");
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Apply filters
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      if (statusFilter && program.status !== statusFilter) return false;

      if (campaignIdFilter) {
        const cid = String(program.campaign?.id ?? "");
        if (cid !== campaignIdFilter) return false;
      }

      if (startDateFilter || endDateFilter) {
        const programStart = program.startDate ? new Date(program.startDate) : null;
        const programEnd = program.endDate ? new Date(program.endDate) : null;
        const filterStart = startDateFilter ? new Date(startDateFilter) : null;
        const filterEnd = endDateFilter ? new Date(endDateFilter) : null;

        if (filterStart && programEnd && programEnd < filterStart) return false;
        if (filterEnd && programStart && programStart > filterEnd) return false;
      }

      return true;
    });
  }, [programs, statusFilter, campaignIdFilter, startDateFilter, endDateFilter]);

  const getStatusBadgeTone = (status: string) => {
    switch (status) {
      case "Active": return "success" as const;
      case "Archived": return "info" as const;
      case "Draft": return "attention" as const;
      case "Paused": return "warning" as const;
      default: return "attention" as const;
    }
  };

  const hasActiveFilters = Boolean(statusFilter || startDateFilter || endDateFilter || campaignIdFilter);

  return (
    <Page
      title="Campaigns"
      subtitle={`${filteredPrograms.length} program${filteredPrograms.length !== 1 ? "s" : ""}`}
      primaryAction={
        <InlineStack gap="200">
          <Button url="/app/campaigns/create" variant="secondary">Create Campaign</Button>
          <Button url="/app/campaigns/programs/create" variant="primary">Create Program</Button>
        </InlineStack>
      }
    >
    <BlockStack gap="300">
        {/* Filters */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Filters</Text>

          {/* 4 fixed columns in one row */}
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <Box style={{ flex: "1 1 25%", minWidth: 0 }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDateFilter}
                onChange={handleStartDateChange}
                autoComplete="off"
              />
            </Box>

            <Box style={{ flex: "1 1 25%", minWidth: 0 }}>
              <TextField
                label="End Date"
                type="date"
                value={endDateFilter}
                onChange={handleEndDateChange}
                autoComplete="off"
              />
            </Box>

            <Box style={{ flex: "1 1 25%", minWidth: 0 }}>
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={handleStatusChange}
              />
            </Box>

            <Box style={{ flex: "1 1 25%", minWidth: 0 }}>
              <Select
                label="Campaign"
                options={campaignOptions}
                value={campaignIdFilter}
                onChange={handleCampaignChange}
              />
            </Box>
          </InlineStack>

          {hasActiveFilters && (
            <InlineStack gap="200">
              <Button onClick={clearFilters} variant="plain">Clear all filters</Button>
              <Text as="span" tone="subdued" variant="bodySm">
                Showing {filteredPrograms.length} of {programs.length} programs
              </Text>
            </InlineStack>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
          
        
          
        {/* Programs Table */}
        <Card>
          <IndexTable
            resourceName={{ singular: "program", plural: "programs" }}
            itemCount={filteredPrograms.length}
            headings={[
              { title: "Program Name" },
              { title: "Code Prefix" },
              { title: "Campaign" },
              { title: "Status" },
              { title: "Program Dates" },
              { title: "Campaign Dates" },
            ]}
            selectable={false}
          >
            {filteredPrograms.map((program: ProgramWithCampaign, index: number) => (
              <IndexTable.Row id={String(program.id)} key={program.id} position={index}>
                {/* Program Name */}
                <IndexTable.Cell>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    <Link to={`/app/campaigns/programs/${program.id}/edit`}>
                      {program.programName}
                    </Link>
                  </Text>
                </IndexTable.Cell>

                {/* Code Prefix column (moved out of Program Name) */}
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    {program.codePrefix ?? "—"}
                  </Text>
                </IndexTable.Cell>

                {/* Campaign (no campaign status badge) */}
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    <Link to={`/app/campaigns/review?campaignId=${program.campaign.id}`}>
                      {program.campaign.campaignName}
                    </Link>
                  </Text>
                </IndexTable.Cell>

                {/* Program Status */}
                <IndexTable.Cell>
                  <Badge tone={getStatusBadgeTone(program.status)}>{program.status}</Badge>
                </IndexTable.Cell>

                {/* Program Dates */}
                <IndexTable.Cell>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm">
                      {program.startDate ? formatDate(program.startDate) : "—"}
                    </Text>
                    <Text as="span" variant="bodySm" tone="subdued">
                      to {program.endDate ? formatDate(program.endDate) : "—"}
                    </Text>
                  </BlockStack>
                </IndexTable.Cell>

                {/* Campaign Dates */}
                <IndexTable.Cell>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      {program.campaign.startDate ? formatDate(program.campaign.startDate) : "—"}
                    </Text>
                    <Text as="span" variant="bodySm" tone="subdued">
                      to {program.campaign.endDate ? formatDate(program.campaign.endDate) : "—"}
                    </Text>
                  </BlockStack>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>

          {filteredPrograms.length === 0 && (
            <div style={{ padding: "var(--p-space-800)" }}>
              <BlockStack gap="200" align="center">
                <Text as="p" variant="bodyLg" alignment="center">
                  {hasActiveFilters ? "No programs match your filters" : "No programs found"}
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  {programs.length === 0
                    ? "Create your first program to get started"
                    : hasActiveFilters
                    ? "Try adjusting your filters or clear them to see all programs"
                    : ""}
                </Text>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="plain">Clear filters to see all programs</Button>
                )}
                {programs.length === 0 && (
                  <Button url="/app/campaigns/programs/create" variant="primary">Create Program</Button>
                )}
              </BlockStack>
            </div>
          )}
        </Card>
    </Page>
  );
}


/*// app/routes/app.campaigns._index.tsx
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
        <InlineStack gap="200">
           <Button
            url="/app/campaigns/create"
            variant="primary">
            Create Campaign
          </Button>
          <Button
            url="/app/campaigns/programs/create"
            variant="secondary">
            Create Program
          </Button>
        </InlineStack>
      }
    >
      <BlockStack gap="500">
      
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
                      <Link to={`/app/campaigns/${c.id}/edit`}>
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

*/