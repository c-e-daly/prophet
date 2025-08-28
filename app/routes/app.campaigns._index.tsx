// app/routes/app.campaigns._index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge, TextField, 
  Select, Box } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import type { Tables } from "../lib/types/dbTables";
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";
import { formatDate } from "../utils/format";
import { toOptions, EnumMap } from "../lib/types/enumTypes";
import {getEnumsCached} from '../lib/enumCache.server';

// Type definitions
type Campaign = Tables<"campaigns">;
type Program = Tables<"programs">;

type ProgramWithCampaign = Program & {
  campaign: Pick<Campaign, "id" | "campaignName" | "startDate" | "endDate" | "status">;
};

type FilterState = {
  startDate: string;
  endDate: string;
  status: string;
  campaignId: string;
};

type LoaderData = {
  programs: ProgramWithCampaign[];
  statusOptions: Array<{ label: string; value: string }>;
  campaignOptions: Array<{ label: string; value: string }>;
  enums: EnumMap;
};

// Utility functions
const createStatusOptionsFromEnums = (programStatusEnum: string[]) => [
  { label: "All Statuses", value: "" },
  ...toOptions(programStatusEnum),
];

const createCampaignOptions = (programs: ProgramWithCampaign[]) => {
  const uniqueCampaignsMap = new Map<number, string>();
  for (const program of programs) {
    if (program.campaign?.id && !uniqueCampaignsMap.has(program.campaign.id)) {
      uniqueCampaignsMap.set(
        program.campaign.id, 
        program.campaign.campaignName || `Campaign ${program.campaign.id}`
      );
    }
  }
  
  return [
    { label: "All Campaigns", value: "" },
    ...Array.from(uniqueCampaignsMap.entries()).map(([id, name]) => ({
      label: name,
      value: String(id),
    })),
  ];
};

const getStatusBadgeTone = (status: string) => {
  const statusToneMap: Record<string, "success" | "info" | "attention" | "warning"> = {
    Active: "success",
    Archived: "info", 
    Draft: "attention",
    Paused: "warning",
  };
  return statusToneMap[status] || "attention";
};

const filterPrograms = (programs: ProgramWithCampaign[], filters: FilterState) => {
  const { startDate, endDate, status, campaignId } = filters;
  
  return programs.filter((program) => {
    // Status filter
    if (status && program.status !== status) return false;

    // Campaign filter
    if (campaignId && String(program.campaign?.id ?? "") !== campaignId) return false;

    // Date range filter
    if (startDate || endDate) {
      const programStart = program.startDate ? new Date(program.startDate) : null;
      const programEnd = program.endDate ? new Date(program.endDate) : null;
      const filterStart = startDate ? new Date(startDate) : null;
      const filterEnd = endDate ? new Date(endDate) : null;

      if (filterStart && programEnd && programEnd < filterStart) return false;
      if (filterEnd && programStart && programStart > filterEnd) return false;
    }

    return true;
  });
};

// Loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop } = await getShopFromSession(request);
  const shopsId = await getShopIdFromSupabase(shop);
  
  // Get both campaigns and enums
  const [campaigns, enums] = await Promise.all([
    fetchCampaignsWithPrograms(shopsId),
    getEnumsCached()
  ]);

  // Transform campaigns to program-centric view
  const programs: ProgramWithCampaign[] = campaigns.flatMap((campaign: any) =>
    campaign.programs.map((program: any) => ({
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

  // Create status options from dynamic enums
  const statusOptions = createStatusOptionsFromEnums(enums.programStatus || []);
  const campaignOptions = createCampaignOptions(programs);

  return json<LoaderData>({ programs, statusOptions, campaignOptions, enums });
};

// Filter Components
function FiltersCard({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  statusOptions, 
  campaignOptions,
  resultCount,
  totalCount 
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  statusOptions: Array<{ label: string; value: string }>;
  campaignOptions: Array<{ label: string; value: string }>;
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
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(value) => onFilterChange("startDate", value)}
              autoComplete="off"
            />
          </div>

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <TextField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(value) => onFilterChange("endDate", value)}
              autoComplete="off"
            />
          </div>

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status}
              onChange={(value) => onFilterChange("status", value)}
            />
          </div>

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <Select
              label="Campaign"
              options={campaignOptions}
              value={filters.campaignId}
              onChange={(value) => onFilterChange("campaignId", value)}
            />
          </div>
        </InlineStack>

        {hasActiveFilters && (
          <InlineStack gap="200">
            <Button onClick={onClearFilters} variant="plain">
              Clear all filters
            </Button>
            <Text as="span" tone="subdued" variant="bodySm">
              Showing {resultCount} of {totalCount} programs
            </Text>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}

function ProgramsTable({ programs }: { programs: ProgramWithCampaign[] }) {
  return (
    <Card>
      <IndexTable
        resourceName={{ singular: "program", plural: "programs" }}
        itemCount={programs.length}
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
        {programs.map((program, index) => (
          <IndexTable.Row id={String(program.id)} key={program.id} position={index}>
            <IndexTable.Cell>
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                <Link to={`/app/campaigns/programs/${program.id}/edit`}>
                  {program.programName}
                </Link>
              </Text>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <Text as="span" variant="bodyMd">
                {program.codePrefix ?? "—"}
              </Text>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <Text as="span" variant="bodyMd">
                <Link to={`/app/campaigns/review/${program.campaign.id}`}>
                  {program.campaign.campaignName}
                </Link>
              </Text>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <Badge tone={getStatusBadgeTone(program.status)}>{program.status}</Badge>
            </IndexTable.Cell>

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
    </Card>
  );
}

function EmptyState({ 
  hasActiveFilters, 
  onClearFilters, 
  totalProgramsCount 
}: { 
  hasActiveFilters: boolean; 
  onClearFilters: () => void;
  totalProgramsCount: number;
}) {
  return (
    <Card>
      <div style={{ padding: "var(--p-space-800)" }}>
        <BlockStack gap="200" align="center">
          <Text as="p" variant="bodyLg" alignment="center">
            {hasActiveFilters ? "No programs match your filters" : "No programs found"}
          </Text>
          <Text as="p" tone="subdued" alignment="center">
            {totalProgramsCount === 0
              ? "Create your first program to get started"
              : hasActiveFilters
              ? "Try adjusting your filters or clear them to see all programs"
              : ""}
          </Text>
          {hasActiveFilters && (
            <Button onClick={onClearFilters} variant="plain">
              Clear filters to see all programs
            </Button>
          )}
          {totalProgramsCount === 0 && (
            <Button url="/app/campaigns/programs/create" variant="primary">
              Create Program
            </Button>
          )}
        </BlockStack>
      </div>
    </Card>
  );
}

// Main Component
export default function CampaignsIndex() {
  const { programs, statusOptions, campaignOptions, enums } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    status: searchParams.get("status") || "",
    campaignId: searchParams.get("campaignId") || "",
  });

  const updateSearchParams = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [setSearchParams]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  }, [filters, updateSearchParams]);

  const handleClearFilters = useCallback(() => {
    const emptyFilters: FilterState = {
      startDate: "",
      endDate: "",
      status: "",
      campaignId: "",
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const filteredPrograms = useMemo(() => 
    filterPrograms(programs, filters), 
    [programs, filters]
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <Page
      title="Campaigns"
      subtitle={`${filteredPrograms.length} program${filteredPrograms.length !== 1 ? "s" : ""}`}
      primaryAction={
        <InlineStack gap="200">
          <Button url="/app/campaigns/create" variant="secondary">
            Create Campaign
          </Button>
          <Button url="/app/campaigns/programs" variant="primary">
            Create Program
          </Button>
        </InlineStack>
      }
    >
      <BlockStack gap="300">
        <FiltersCard
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          statusOptions={statusOptions}
          campaignOptions={campaignOptions}
          resultCount={filteredPrograms.length}
          totalCount={programs.length}
        />

        {filteredPrograms.length > 0 ? (
          <ProgramsTable programs={filteredPrograms} />
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            totalProgramsCount={programs.length}
          />
        )}
      </BlockStack>
    </Page>
  );
}


/*// app/routes/app.campaigns._index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge, TextField, 
  Select, Box } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import type { Tables } from "../lib/types/dbTables";
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";
import { formatDate } from "../utils/format";
import { ProgramStatusValues } from "../lib/types/enumTypes";

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
          <Button url="/app/campaigns/programs" variant="primary">Create Program</Button>
        </InlineStack>
      }
    >
    <BlockStack gap="300">
   
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Filters</Text>

        
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
              
                <IndexTable.Cell>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    <Link to={`/app/campaigns/programs/${program.id}/edit`}>
                      {program.programName}
                    </Link>
                  </Text>
                </IndexTable.Cell>

        
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    {program.codePrefix ?? "—"}
                  </Text>
                </IndexTable.Cell>

               
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    <Link to={`/app/campaigns/review/${program.campaign.id}`}>
                      {program.campaign.campaignName}
                    </Link>
                  </Text>
                </IndexTable.Cell>

          
                <IndexTable.Cell>
                  <Badge tone={getStatusBadgeTone(program.status)}>{program.status}</Badge>
                </IndexTable.Cell>

  
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

*/