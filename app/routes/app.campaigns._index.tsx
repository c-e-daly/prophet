// app/routes/app.campaigns._index.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge, 
  TextField, Select } from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import { getShopCampaigns } from "../lib/queries/supabase/getShopCampaigns";
import { formatDate } from "../utils/format";
import type { ProgramWithCampaign, CampaignWithPrograms } from "../lib/types/dbTables";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

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
};

// ---- Utils ----
const getStatusBadgeTone = (status: string) => {
  const map: Record<string, "success" | "info" | "attention" | "warning"> = {
    Active: "success",
    Archived: "info",
    Draft: "attention",
    Paused: "warning",
  };
  return map[status] || "attention";
};

const filterPrograms = (programs: ProgramWithCampaign[], filters: FilterState) => {
  const { startDate, endDate, status, campaignId } = filters;

  return programs.filter((program) => {
    if (status && program.status !== status) return false;
    if (campaignId && String(program.campaigns?.id ?? "") !== campaignId) return false;

    if (startDate || endDate) {
      const pStart = program.startDate ? new Date(program.startDate) : null;
      const pEnd = program.endDate ? new Date(program.endDate) : null;
      const fStart = startDate ? new Date(startDate) : null;
      const fEnd = endDate ? new Date(endDate) : null;

      if (fStart && pEnd && pEnd < fStart) return false;
      if (fEnd && pStart && pStart > fEnd) return false;
    }
    return true;
  });
};

const createCampaignOptions = (programs: ProgramWithCampaign[]) => {
  const seen = new Map<number, string>();
  for (const p of programs) {
    const id = p.campaigns?.id;
    if (id && !seen.has(id)) {
      seen.set(id, p.campaigns.name || `Campaign ${id}`);
    }
  }
  return [
    { label: "All Campaigns", value: "" },
    ...Array.from(seen.entries()).map(([id, name]) => ({ label: name, value: String(id) })),
  ];
};

// ---- Loader ----
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);

  if (!shopsID) {
    throw new Response("Shop not found", { status: 404 });
  }

  const campaigns = await getShopCampaigns(shopsID);
 
  
  const programs: ProgramWithCampaign[] = (campaigns ?? []).flatMap((campaign: CampaignWithPrograms) =>
    (campaign.programs ?? []).map((program) => ({
      ...program,
      campaigns: {
        id: campaign.id,
        name: campaign.name, 
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
      },
    }))
  );

  const uniqueStatuses = Array.from(new Set(programs.map((p) => p.status).filter(Boolean)));
  const statusOptions = [
    { label: "All Statuses", value: "" },
    ...uniqueStatuses.sort().map((v) => ({ label: v, value: v })),
  ];

  const campaignOptions = createCampaignOptions(programs);
  
  return json<LoaderData>({ programs, statusOptions, campaignOptions});
};

// ---- Subcomponents ----
function FiltersCard({
  filters,
  onFilterChange,
  onClearFilters,
  statusOptions,
  campaignOptions,
  resultCount,
  totalCount,
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

          <div style={{ flex: "1 1 25%", minWidth: 0 }}>
            <Select
              label="Campaign"
              options={campaignOptions}
              value={filters.campaignId}
              onChange={(v) => onFilterChange("campaignId", v)}
            />
          </div>
        </InlineStack>

        {hasActiveFilters && (
          <InlineStack gap="200">
            <Button onClick={onClearFilters} variant="plain">Clear all filters</Button>
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
          { title: "Program" },
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
                <Link to={`/app/programs/${program.id}`}>{program.name}</Link>
              </Text>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <Text as="span" variant="bodyMd">
                <Link to={`/app/campaigns/${program.campaigns.id}`}>
                  {program.campaigns.name}
                </Link>
              </Text>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <Badge tone={getStatusBadgeTone(program.status)}>{program.status}</Badge>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <BlockStack gap="100">
                <Text as="span" variant="bodySm">{program.startDate ? formatDate(program.startDate) : "—"}</Text>
                <Text as="span" variant="bodySm" tone="subdued">to {program.endDate ? formatDate(program.endDate) : "—"}</Text>
              </BlockStack>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <BlockStack gap="100">
                <Text as="span" variant="bodySm" tone="subdued">
                  {program.campaigns.startDate ? formatDate(program.campaigns.startDate) : "—"}
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  to {program.campaigns.endDate ? formatDate(program.campaigns.endDate) : "—"}
                </Text>
              </BlockStack>
            </IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
    </Card>
  );
}

// ---- Main ----
export default function CampaignsIndex() {
  const { programs, statusOptions, campaignOptions } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    status: searchParams.get("status") || "",
    campaignId: searchParams.get("campaignId") || "",
  });

  const updateSearchParams = useCallback((next: FilterState) => {
    const params = new URLSearchParams();
    (Object.entries(next) as Array<[keyof FilterState, string]>).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  }, [setSearchParams]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    updateSearchParams(next);
  }, [filters, updateSearchParams]);

  const handleClearFilters = useCallback(() => {
    const empty: FilterState = { startDate: "", endDate: "", status: "", campaignId: "" };
    setFilters(empty);
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const filteredPrograms = useMemo(() => filterPrograms(programs, filters), [programs, filters]);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <Page
      title="Campaigns"
      subtitle={`${filteredPrograms.length} program${filteredPrograms.length !== 1 ? "s" : ""}`}
      primaryAction={
        <InlineStack gap="200">
          <Button url="/app/campaigns/create/" variant="secondary">Create Campaign</Button>
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
          <Card>
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
                {hasActiveFilters ? (
                  <Button onClick={handleClearFilters} variant="plain">Clear filters to see all programs</Button>
                ) : (
                  programs.length === 0 && (
                    <Button url="/app/programs/create/" variant="primary">Create Program</Button>
                  )
                )}
              </BlockStack>
            </div>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}

