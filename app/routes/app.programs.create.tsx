// app/routes/app.programs.create.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, InlineGrid, Badge } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { PROGRAM_STATUS_OPTIONS,  PROGRAM_FOCUS_OPTIONS,  PROGRAM_GOAL_OPTIONS,
  GOAL_METRIC_OPTIONS, YES_NO_OPTIONS, type CampaignRow, type ProgramRow,  type UpsertProgramPayload 
} from "../lib/types/dbTables";
import { DateTimeField } from "../components/dateTimeField";
import { badgeToneForStatus, formatRange } from "../utils/statusHelpers";
import { formatCurrencyUSD } from "../utils/format";
import { upsertShopProgram } from "../lib/queries/supabase/upsertShopCampaignProgram";
import { getShopSingleCampaign } from "../lib/queries/supabase/getShopSingleCampaign";
import { getCampaignLatestProgramDate } from "../lib/queries/supabase/getCampaignLatestProgramDate";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess, redirectWithError } from "../utils/flash.server";
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ============================================================================
// Types
// ============================================================================

type LoaderData = {
  campaign: CampaignRow;
  programs: ProgramRow[];
  latestProgramEndDate: string | null;
  flash: { type: "success" | "error" | "info" | "warning"; message: string } | null;
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const flash = await getFlashMessage(request);
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId");

  if (!campaignId) {
    return redirectWithError("/app/campaigns", "Campaign ID is required to create a program");
  }

  try {
    const [campaignData, latestProgramEndDate] = await Promise.all([
      getShopSingleCampaign(shopsID, Number(campaignId)),
      getCampaignLatestProgramDate(shopsID, Number(campaignId)),
    ]);

    if (!campaignData.campaign) {
      return redirectWithError("/app/campaigns", "Campaign not found");
    }

    return json<LoaderData>({
      campaign: campaignData.campaign,
      programs: campaignData.programs as ProgramRow[],
      latestProgramEndDate,
      flash,
    });
  } catch (error) {
    console.error('[Program Create Loader] Error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : String(error),
      shopsID,
      campaignId,
      timestamp: new Date().toISOString(),
    });
    return redirectWithError("/app/campaigns", "Unable to load campaign details");
  }
};

// ============================================================================
// Action
// ============================================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName } = await requireAuthContext(request);
  const form = await request.formData();

  const num = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const str = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";
  
  const strOrUndef = (v: FormDataEntryValue | null): string | undefined => {
    const s = v?.toString().trim();
    return s || undefined;
  };

  const pickFrom = (val: string | undefined, opts: readonly { value: string; label: string }[]) =>
    val && opts.some(o => o.value === val) ? val : undefined;

  const statusRaw = strOrUndef(form.get("status"));
  const focusRaw = strOrUndef(form.get("programFocus"));

  const payload: UpsertProgramPayload = {
    // No id - create new program
    campaigns: num(form.get("campaigns")) ?? undefined,
    name: str(form.get("programName")) || "",
    description: str(form.get("programDescription")) || null,
    startDate: str(form.get("programStartDate")) || null,
    endDate: str(form.get("programEndDate")) || null,
    status: pickFrom(statusRaw, PROGRAM_STATUS_OPTIONS) as any,
    focus: pickFrom(focusRaw, PROGRAM_FOCUS_OPTIONS) ?? null as any,
    codePrefix: str(form.get("codePrefix")) || "",
    acceptRate: num(form.get("acceptRate")) || undefined,
    declineRate: num(form.get("declineRate")) || undefined,
    expiryMinutes: num(form.get("expiryMinutes")),
    combineOrderDiscounts: str(form.get("combineOrderDiscounts")) === "true",
    combineProductDiscounts: str(form.get("combineProductDiscounts")) === "true",
    combineShippingDiscounts: str(form.get("combineShippingDiscounts")) === "true",
    goalType: (str(form.get("goalType")) || null) as any,
    goalMetric: (str(form.get("goalMetric")) || null) as any,
    goalValue: num(form.get("goalValue")),
    isDefault: false,
    createdByUser: currentUserId,
    createdByUserName: currentUserName,
  };

  if (!payload.campaigns) {
    return json(
      { error: "Campaign ID is required" },
      { status: 400 }
    );
  }

  try {
    // Validate: Program dates must be within campaign dates
    const campaignData = await getShopSingleCampaign(shopsID, payload.campaigns);
    const campaign = campaignData.campaign;

    if (!campaign) {
      return json({ error: "Campaign not found" }, { status: 404 });
    }

    if (payload.startDate && campaign.startDate) {
      const programStart = new Date(payload.startDate);
      const campaignStart = new Date(campaign.startDate);
      
      if (programStart < campaignStart) {
        return json(
          { error: `Program must start on or after campaign start date (${campaignStart.toLocaleDateString()})` },
          { status: 400 }
        );
      }
    }

    if (payload.endDate && campaign.endDate) {
      const programEnd = new Date(payload.endDate);
      const campaignEnd = new Date(campaign.endDate);
      
      if (programEnd > campaignEnd) {
        return json(
          { error: `Program must end on or before campaign end date (${campaignEnd.toLocaleDateString()})` },
          { status: 400 }
        );
      }
    }

    // Validate: Program dates must not overlap other programs
    const latestProgramEndDate = await getCampaignLatestProgramDate(shopsID, payload.campaigns);
    if (latestProgramEndDate && payload.startDate) {
      const latestEnd = new Date(latestProgramEndDate);
      const newStart = new Date(payload.startDate);
      
      if (newStart <= latestEnd) {
        return json(
          { error: `Program must start after ${latestEnd.toLocaleDateString()}` },
          { status: 400 }
        );
      }
    }

    const result = await upsertShopProgram(shopsID, payload);
    return redirectWithSuccess(`/app/campaigns/${payload.campaigns}`, "Program created successfully");
  } catch (error) {
    console.error('[Program Create] Error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : String(error),
      shopsID,
      programName: payload.name,
      campaignId: payload.campaigns,
      timestamp: new Date().toISOString(),
    });

    return json(
      { error: error instanceof Error ? error.message : "Failed to create program" },
      { status: 500 }
    );
  }
};

// ============================================================================
// Component
// ============================================================================

export default function CreateProgramPage() {
  const { campaign, programs, latestProgramEndDate, flash } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [form, setForm] = React.useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Draft",
    focus: "",
    codePrefix: "",
    acceptRate: "",
    declineRate: "",
    expiryMinutes: "",
    combineOrderDiscounts: "false",
    combineProductDiscounts: "false",
    combineShippingDiscounts: "false",
    goalType: "",
    goalMetric: "",
    goalValue: "",
  });

  // Calculate date constraints
  const dateConstraints = React.useMemo(() => {
    const campaignStart = campaign.startDate ? new Date(campaign.startDate) : null;
    const campaignEnd = campaign.endDate ? new Date(campaign.endDate) : null;
    const latestProgramEnd = latestProgramEndDate ? new Date(latestProgramEndDate) : null;

    let minStartDate = campaignStart;
    if (latestProgramEnd && campaignStart) {
      minStartDate = latestProgramEnd > campaignStart ? latestProgramEnd : campaignStart;
    } else if (latestProgramEnd) {
      minStartDate = latestProgramEnd;
    }

    const minStartMessage = minStartDate ? new Date(minStartDate.getTime() + 86400000).toLocaleDateString() : null;
    const maxEndMessage = campaignEnd ? campaignEnd.toLocaleDateString() : null;

    return { minStartMessage, maxEndMessage };
  }, [campaign.startDate, campaign.endDate, latestProgramEndDate]);

  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  return (
    <Page
      title="Create New Program"
      backAction={{ onAction: () => navigate(`/app/campaigns/${campaign.id}`) }}
    >
      <FlashBanner flash={flash} />

      <InlineGrid columns={["twoThirds", "oneThird"]} gap="500" alignItems="start">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Program Details
            </Text>
            <RemixForm method="post" replace>
              <FormLayout>
                <input type="hidden" name="campaigns" value={campaign.id} />
                <input type="hidden" name="programStartDate" value={form.startDate} />
                <input type="hidden" name="programEndDate" value={form.endDate} />

                <TextField
                  label="Campaign"
                  value={campaign.name ?? ""}
                  autoComplete="off"
                  readOnly
                  disabled
                  helpText="Programs are created within campaigns"
                />

                <TextField
                  label="Program Name"
                  name="programName"
                  value={form.name}
                  onChange={handleChange("name")}
                  autoComplete="off"
                  requiredIndicator
                />

                <TextField
                  label="Description"
                  name="programDescription"
                  value={form.description}
                  onChange={handleChange("description")}
                  autoComplete="off"
                  multiline={2}
                />

                <InlineGrid gap="300" columns={3}>
                  <Select
                    name="programFocus"
                    label="Focus"
                    options={PROGRAM_FOCUS_OPTIONS}
                    value={form.focus}
                    onChange={handleChange("focus")}
                  />
                  <TextField
                    label="Code Prefix"
                    name="codePrefix"
                    value={form.codePrefix}
                    onChange={handleChange("codePrefix")}
                    autoComplete="off"
                  />
                  <Select
                    name="status"
                    label="Status"
                    options={PROGRAM_STATUS_OPTIONS}
                    value={form.status}
                    onChange={handleChange("status")}
                    requiredIndicator
                  />
                </InlineGrid>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Program Dates</Text>
                  {(dateConstraints.minStartMessage || dateConstraints.maxEndMessage) && (
                    <Text as="p" variant="bodySm" tone="caution">
                      {dateConstraints.minStartMessage && `Program must start after ${dateConstraints.minStartMessage}. `}
                      {dateConstraints.maxEndMessage && `Program must end by ${dateConstraints.maxEndMessage}.`}
                    </Text>
                  )}
                  <InlineGrid gap="300" columns={2}>
                    <DateTimeField
                      label="Start Date & Time"
                      value={form.startDate}
                      onChange={handleDateChange("startDate")}
                    />
                    <DateTimeField
                      label="End Date & Time"
                      value={form.endDate}
                      onChange={handleDateChange("endDate")}
                    />
                  </InlineGrid>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Offer Evaluation</Text>
                  <InlineGrid gap="300" columns={3}>
                    <TextField
                      label="Accept Rate (%)"
                      name="acceptRate"
                      type="number"
                      value={form.acceptRate}
                      onChange={handleChange("acceptRate")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Decline Rate (%)"
                      name="declineRate"
                      type="number"
                      value={form.declineRate}
                      onChange={handleChange("declineRate")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Expiry (Min)"
                      name="expiryMinutes"
                      type="number"
                      value={form.expiryMinutes}
                      onChange={handleChange("expiryMinutes")}
                      autoComplete="off"
                    />
                  </InlineGrid>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Combine Discounts</Text>
                  <InlineGrid gap="300" columns={3}>
                    <Select
                      label="Order"
                      name="combineOrderDiscounts"
                      options={YES_NO_OPTIONS}
                      value={form.combineOrderDiscounts}
                      onChange={handleChange("combineOrderDiscounts")}
                    />
                    <Select
                      label="Product"
                      name="combineProductDiscounts"
                      options={YES_NO_OPTIONS}
                      value={form.combineProductDiscounts}
                      onChange={handleChange("combineProductDiscounts")}
                    />
                    <Select
                      label="Shipping"
                      name="combineShippingDiscounts"
                      options={YES_NO_OPTIONS}
                      value={form.combineShippingDiscounts}
                      onChange={handleChange("combineShippingDiscounts")}
                    />
                  </InlineGrid>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Program Goal (Optional)</Text>
                  <InlineGrid gap="300" columns={3}>
                    <Select
                      label="Goal Type"
                      name="goalType"
                      options={PROGRAM_GOAL_OPTIONS}
                      value={form.goalType}
                      onChange={handleChange("goalType")}
                    />
                    <Select
                      label="Goal Metric"
                      name="goalMetric"
                      options={GOAL_METRIC_OPTIONS}
                      value={form.goalMetric}
                      onChange={handleChange("goalMetric")}
                    />
                    <TextField
                      label="Goal Value"
                      name="goalValue"
                      type="number"
                      value={form.goalValue}
                      onChange={handleChange("goalValue")}
                      autoComplete="off"
                    />
                  </InlineGrid>
                </BlockStack>

                <Button submit variant="primary">
                  Create Program
                </Button>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        {/* Sidebar */}
        <BlockStack gap="400">
          {/* Campaign Context */}
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Campaign</Text>
              <Card background="bg-surface-secondary" padding="300">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" fontWeight="semibold">
                    {campaign.name}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {formatRange(campaign.startDate ?? "", campaign.endDate ?? "")}
                  </Text>
                  {campaign.budget && (
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodySm" tone="subdued">Budget:</Text>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        {formatCurrencyUSD((campaign.budget ?? 0) * 100)}
                      </Text>
                    </InlineStack>
                  )}
                </BlockStack>
              </Card>
            </BlockStack>
          </Card>

          {/* Other Programs */}
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Other Programs</Text>
              {programs.length === 0 ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  No other programs in this campaign yet.
                </Text>
              ) : (
                <BlockStack gap="200">
                  {programs.map((p) => (
                    <Card key={p.id} padding="300">
                      <InlineStack align="space-between">
                        <BlockStack gap="050">
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            {p.name || `Program #${p.id}`}
                          </Text>
                          <Text as="span" variant="bodyXs" tone="subdued">
                            {p.focus}
                          </Text>
                        </BlockStack>
                        <Badge tone={badgeToneForStatus(p.status ?? "")}>
                          {p.status}
                        </Badge>
                      </InlineStack>
                    </Card>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}

export { ErrorBoundary };