// app/routes/app.campaigns.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigation, useNavigate, Form as RemixForm, useSubmit, Link } from "@remix-run/react";
import { Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, Modal, InlineGrid, Badge} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { getShopSingleCampaign } from "../lib/queries/supabase/getShopSingleCampaign";
import { upsertShopCampaign } from "../lib/queries/supabase/upsertShopCampaign";
import { deleteShopCampaignCascade } from "../lib/queries/supabase/deleteShopCampaignCascade";
import type { CampaignRow, CampaignStatus, UpsertCampaignPayload } from "../lib/types/dbTables"
import { formatDateTime } from "../utils/format";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess,  redirectWithError} from "../utils/flash.server";
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import CampaignsIndex from "./app.campaigns._index";

// ============================================================================
// Types
// ============================================================================

type ProgramSummary = {
  id: number;
  name: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  focus: string | null;
};

type EnumOption = { label: string; value: string };

type LoaderData = {
  campaign: CampaignRow | null;
  programs: ProgramSummary[];
  campaignStatus: CampaignStatus[];
  typeOptions: EnumOption[];
  metricOptions: EnumOption[];
  isEdit: boolean;
  flash: {  type: "success" | "error" | "info" | "warning"; message: string; } | null;
  session: {
    shopsID: number;
    shopDomain: string;
    currentUserId: number | undefined;
    currentUserName: string | undefined;
  };
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, session, currentUserId, currentUserName } = await getAuthContext(request);
  const { id } = params;
  const isEdit = id !== "new";

 const flash = await getFlashMessage(request);

  let campaign: CampaignRow | null = null;
  let programs: ProgramSummary[] = [];

  if (isEdit && id) {
    try {
      const result = await getShopSingleCampaign(shopsID, Number(id));
      campaign = result.campaign;
      programs = result.programs as ProgramSummary[];

      if (!campaign) {
        throw new Response("We cannot seem to find that campaign", { 
          status: 404,
          statusText: "Campaign not found" 
        });
      }
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error && error.message.includes("campaign_not_found")) {
        throw new Response("We cannot seem to find that campaign", { 
          status: 404,
          statusText: "Campaign not found" 
        });
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  // Load enums
  const { getEnumsServer } = await import("../lib/queries/supabase/getEnums.server");
  const enums = await getEnumsServer();
  const toOptions = (vals?: string[]): EnumOption[] =>
    (vals ?? []).map((v) => ({ label: v, value: v }));

  const campaignStatus = (enums.campaignStatus ?? []) as CampaignStatus[];
  const typeOptions = toOptions(enums.programGoal);
  const metricOptions = toOptions(enums.goalMetric);

  return json<LoaderData>({
    campaign,
    programs,
    campaignStatus,
    typeOptions,
    metricOptions,
    isEdit,
    flash,
    session: {
      shopsID: shopsID,
      shopDomain: session.shop,
      currentUserId: currentUserId,
      currentUserName: currentUserName
    },
  });
};

// ============================================================================
// Action
// ============================================================================

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName} = await requireAuthContext(request);
  const { id } = params;
  const isEdit = id !== "new";
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  // ---- Handle Delete ----
  if (intent === "delete" && isEdit) {
    try {
      await deleteShopCampaignCascade(shopsID, Number(id));
      return redirectWithSuccess(
        "/app/campaigns", 
        "Campaign deleted successfully"
      );
    } catch (error) {
      return redirectWithError(
        "/app/campaigns",
        "Failed to delete campaign. Please try again."
      );
    }
  }

  // ---- Helper Functions ----
  const parseNullableNumber = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseGoals = (v: FormDataEntryValue | null) => {
    try {
      const arr = JSON.parse((v ?? "[]").toString()) as Array<{
        type: string; 
        metric: string; 
        value: string | number;
      }>;
      return arr.map(g => ({
        goal: g.type,
        metric: g.metric,
        value: Number(g.value ?? 0)
      }));
    } catch {
      return [];
    }
  };

  // ---- Build Payload ----
  const payload: UpsertCampaignPayload = {
    ...(isEdit && id && { id: Number(id) }),
    name: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? null,
    codePrefix: form.get("codePrefix")?.toString() ?? null,
    budget: parseNullableNumber(form.get("budget")),
    startDate: form.get("campaignStartDate")?.toString() || null,
    endDate: form.get("campaignEndDate")?.toString() || null,
    goals: parseGoals(form.get("campaignGoals")),
    isDefault: false,
    status: (form.get("status")?.toString() || "Draft") as any,
    createdByUser: currentUserId || undefined,
    createdByUserName: currentUserName || undefined,
  };

  // ---- Save Campaign ----
  try {
    await upsertShopCampaign(shopsID, payload);
    
    return redirectWithSuccess(
      "/app/campaigns",
      isEdit 
        ? "Campaign updated successfully" 
        : "Campaign created successfully"
    );
  } catch (error) {
    console.error('[Campaign Action] Error:', error);
    
    // Return error to stay on page
    return json(
      { 
        error: error instanceof Error 
          ? error.message 
          : `Failed to ${isEdit ? "update" : "create"} campaign` 
      },
      { status: 400 }
    );
  }
};

// ============================================================================
// Component
// ============================================================================

export default function CampaignPage() {
  const {
    campaign,
    programs,
    typeOptions,
    metricOptions,
    campaignStatus,
    isEdit,
    flash,
  } = useLoaderData<typeof loader>();
  
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const submit = useSubmit();

  // Initialize form state
  const [form, setForm] = React.useState(() => {
    const existingGoals = campaign?.goals;
    let parsedGoals: Array<{ type: string; metric: string; value: string | number }> = [];

    if (Array.isArray(existingGoals)) {
      parsedGoals = existingGoals.map(goal => {
        if (typeof goal === 'object' && goal !== null) {
          const g = goal as any;
          return {
            type: g.goal || g.type || "",
            metric: g.goalMetric || g.metric || "",
            value: g.goalValue || g.value || ""
          };
        }
        return { type: "", metric: "", value: "" };
      });
    }

    return {
      name: campaign?.name ?? "",
      description: campaign?.description ?? "",
      startDate: campaign?.startDate ?? "",
      endDate: campaign?.endDate ?? "",
      codePrefix: campaign?.codePrefix ?? "",
      status: campaign?.status ?? "Draft",
      budget: campaign?.budget === null || campaign?.budget === undefined ? "" : String(campaign.budget),
      goals: parsedGoals,
      currentUserId : campaign?.createdByUser || undefined,
      currentUserName : campaign?.createdByUserName || undefined
    };
  });

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Event handlers
  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  const handleAddGoal = () =>
    setForm((prev) => ({
      ...prev,
      goals: [...prev.goals, { type: "", metric: "", value: "" }],
    }));

  const handleGoalChange = (
    index: number,
    key: "type" | "metric" | "value",
    value: string
  ) => {
    const updated = [...form.goals];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, goals: updated }));
  };

  const handleDeleteGoal = (index: number) => {
    const updated = [...form.goals];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, goals: updated }));
  };

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    submit(fd, { method: "post" });
  };

  // Memoized options
  const statusOptions = React.useMemo(
    () => (campaignStatus ?? []).map((s) => ({ label: s, value: s })),
    [campaignStatus]
  );

  const goalTypeOptions = React.useMemo(
    () => typeOptions.length > 0 ? typeOptions : [
      { label: "Gross Margin", value: "Gross Margin" },
      { label: "Average Order Value", value: "Average Order Value" },
      { label: "New Customers", value: "New Customers" },
      { label: "Conversion Rate", value: "Conversion Rate" },
      { label: "Unit Volume", value: "Unit Volume" }
    ], [typeOptions]
  );

  const goalMetricOptions = React.useMemo(
    () => metricOptions.length > 0 ? metricOptions : [
      { label: "Dollars", value: "Dollars" },
      { label: "Percent", value: "Percent" },
      { label: "Consumers", value: "Consumers" },
      { label: "Orders", value: "Orders" },
      { label: "Units", value: "Units" }
    ], [metricOptions]
  );

  const pageTitle = isEdit ? `Edit Campaign: ${campaign?.name ?? ""}` : "Create New Campaign";
  const submitText = isEdit ? "Save Changes" : "Create Campaign";

  return (
    <Page
      title={pageTitle}
      secondaryActions={isEdit ? [
        {
          content: "Delete campaign",
          onAction: () => setDeleteOpen(true),
          destructive: true,
          icon: DeleteIcon,
        },
      ] : []}
    >
      {/* Flash Banner */}
      <FlashBanner flash={flash} />

      <Box paddingBlockEnd="300">
        <Button
          variant="plain"
          onClick={() => navigate("/app/campaigns", { replace: true })}>
          Back to campaigns
        </Button>
      </Box>

      <InlineGrid columns={['twoThirds', 'oneThird']} gap="500" alignItems="start">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Campaign Details
            </Text>
            <RemixForm method="post" replace>
              <FormLayout>
                <input
                  type="hidden"
                  name="campaignGoals"
                  value={JSON.stringify(form.goals)}
                />
                <input type="hidden" name="campaignStartDate" value={form.startDate} />
                <input type="hidden" name="campaignEndDate" value={form.endDate} />

                <TextField
                  label="Campaign Name"
                  name="campaignName"
                  value={form.name}
                  onChange={handleChange("name")}
                  autoComplete="off"
                  requiredIndicator
                />

                <TextField
                  label="Campaign Description"
                  name="campaignDescription"
                  value={form.description}
                  onChange={handleChange("description")}
                  autoComplete="off"
                  multiline={3}
                />

                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  value={form.codePrefix}
                  onChange={handleChange("codePrefix")}
                  autoComplete="off"
                  helpText="Optional prefix for discount codes"
                />

                <Select
                  name="status"
                  label="Campaign Status"
                  options={statusOptions}
                  value={form.status}
                  onChange={handleChange("status")}
                  helpText="Current lifecycle state"
                />

                <TextField
                  label="Budget ($)"
                  name="budget"
                  type="number"
                  value={String(form.budget ?? "")}
                  onChange={handleChange("budget")}
                  autoComplete="off"
                  inputMode="decimal"
                />

                <FormLayout.Group>
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
                </FormLayout.Group>

                {/* Campaign Goals */}
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Campaign Goals (Optional)
                    </Text>
                    <Button 
                      icon={PlusIcon} 
                      onClick={handleAddGoal} 
                      variant="plain"
                      size="slim"
                    >
                      Add Goal
                    </Button>
                  </InlineStack>

                  {form.goals.length === 0 ? (
                    <Text as="p" tone="subdued" variant="bodySm">
                      Add one or more goals to track campaign success.
                    </Text>
                  ) : (
                    <BlockStack gap="300">
                      {form.goals.map((goal, index) => (
                        <Card key={index} padding="400">
                          <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
                            <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                              <Select
                                label="Type"
                                options={goalTypeOptions}
                                value={String(goal.type ?? "")}
                                onChange={(v) => handleGoalChange(index, "type", v)}
                              />
                            </div>
                            <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                              <Select
                                label="Metric"
                                options={goalMetricOptions}
                                value={String(goal.metric ?? "")}
                                onChange={(v) => handleGoalChange(index, "metric", v)}
                              />
                            </div>
                            <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                              <TextField
                                label="Value"
                                type="number"
                                value={String(goal.value ?? "")}
                                onChange={(v) => handleGoalChange(index, "value", v)}
                                autoComplete="off"
                                inputMode="decimal"
                              />
                            </div>
                            <div style={{ flex: "0 0 auto", paddingTop: "28px" }}>
                              <Button
                                icon={DeleteIcon}
                                variant="plain"
                                tone="critical"
                                onClick={() => handleDeleteGoal(index)}
                                accessibilityLabel="Delete goal"
                              />
                            </div>
                          </InlineStack>
                        </Card>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>

                <InlineStack gap="300" align="start">
                  <Button submit variant="primary" loading={isSubmitting}>
                    {submitText}
                  </Button>
                  {isEdit && (
                    <Button
                      tone="critical"
                      onClick={() => setDeleteOpen(true)}
                      icon={DeleteIcon}
                    >
                      Delete
                    </Button>
                  )}
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        {/* Programs Sidebar */}
        <Card>
          <BlockStack gap="300">
            {isEdit ? (
              <>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Programs in this Campaign
                  </Text>
                  <Link to={`/app/campaigns/programs/new?campaignId=${campaign!.id}`}>
                    <Button variant="primary" icon={PlusIcon} size="slim">
                      Create Program
                    </Button>
                  </Link>
                </InlineStack>

                {programs.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No programs yet. Create your first program to get started.
                  </Text>
                ) : (
                  <BlockStack gap="200">
                    {programs.map((p) => (
                      <Card key={p.id} padding="300">
                        <InlineStack align="space-between" blockAlign="center" wrap={false}>
                          <BlockStack gap="050">
                            <Text as="h3" variant="headingSm">
                              {p.name || `Program #${p.id}`}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {formatRange(p.startDate ?? undefined, p.endDate ?? undefined)}
                            </Text>
                            {p.focus && (
                              <Text as="p" variant="bodySm">
                                Focus: {p.focus}
                              </Text>
                            )}
                          </BlockStack>
                          <InlineStack gap="200" blockAlign="center">
                            <Badge tone={badgeToneForStatus(p.status ?? undefined)}>
                              {p.status ?? "Draft"}
                            </Badge>
                            <Link to={`/app/campaigns/programs/${p.id}`}>
                              <Button variant="secondary" size="slim">Edit</Button>
                            </Link>
                          </InlineStack>
                        </InlineStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </>
            ) : (
              <>
                <Text as="h2" variant="headingMd">
                  About Programs
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  After creating your campaign, you'll be able to add programs that define specific
                  offer rules, discount parameters, and targeting criteria for your customer-generated offers.
                </Text>
              </>
            )}
          </BlockStack>
        </Card>
      </InlineGrid>

      {/* Delete Modal */}
      {isEdit && (
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete campaign?"
          primaryAction={{
            content: "Delete campaign",
            destructive: true,
            onAction: confirmDelete,
            loading: isSubmitting,
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setDeleteOpen(false) }
          ]}
        >
          <Modal.Section>
            <Text as="p">
              This will permanently delete this campaign and all associated programs.
              This action cannot be undone.
            </Text>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (isoString: string) => void;
}) {
  const [dateVal, setDateVal] = React.useState("");
  const [timeVal, setTimeVal] = React.useState("12:00");

  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setDateVal(`${year}-${month}-${day}`);

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setTimeVal(`${hours}:${minutes}`);
      }
    } else {
      setDateVal("");
      setTimeVal("12:00");
    }
  }, [value]);

  React.useEffect(() => {
    if (dateVal && timeVal) {
      const iso = new Date(`${dateVal}T${timeVal}:00`).toISOString();
      onChange(iso);
    } else {
      onChange("");
    }
  }, [dateVal, timeVal, onChange]);

  return (
    <InlineStack gap="200">
      <TextField
        label={`${label} (Date)`}
        type="date"
        value={dateVal}
        onChange={setDateVal}
        autoComplete="off"
      />
      <TextField
        label={`${label} (Time)`}
        type="time"
        value={timeVal}
        onChange={setTimeVal}
        autoComplete="off"
      />
    </InlineStack>
  );
}

function formatRange(startISO?: string, endISO?: string) {
  const s = startISO ? formatDateTime(startISO) : "";
  const e = endISO ? formatDateTime(endISO) : "";
  if (s && e) return `${s} — ${e}`;
  if (s) return s;
  if (e) return e;
  return "No dates set";
}

function badgeToneForStatus(
  status?: string
): "success" | "warning" | "critical" | "attention" | "info" | undefined {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "PAUSED") return "warning";
  if (s === "ARCHIVED") return "critical";
  if (s === "DRAFT") return "info";
  return undefined;
}

// ============================================================================
// Error Boundary
// ============================================================================

export { ErrorBoundary };


/*
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, useNavigate, Form as RemixForm, useSubmit, Link } from "@remix-run/react";
import { Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, Modal, InlineGrid, Badge} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { getShopSingleCampaign } from "../lib/queries/supabase/getShopSingleCampaign";
import { upsertShopCampaign } from "../lib/queries/supabase/upsertShopCampaign";
import { deleteShopCampaignCascade } from "../lib/queries/supabase/deleteShopCampaignCascade";
import type { CampaignRow, CampaignStatus, ProgramRow, UpsertCampaignPayload } from "../lib/types/dbTables";
import { formatDateTime } from "../utils/format";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess, redirectWithError } from "../../app/utils/flash.server";

// ✅ Import reusable components
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";



type ProgramSummary = {
  id: number;
  name: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  focus: string | null;
};

type EnumOption = { label: string; value: string };

type LoaderData = {
  campaign: CampaignRow | null;
  programs: ProgramSummary[];
  campaignStatus: CampaignStatus[];  // ✅ Use imported type
  typeOptions: EnumOption[];
  metricOptions: EnumOption[];
  isEdit: boolean;
  flash: { type: string; message: string } | null;
  session: {
    shopsID: number;
    shopDomain: string;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, currentUserId, session } = await getAuthContext(request);
  const { id } = params;
  const isEdit = id !== "new";

  console.log('[Campaign Loader] Starting:', { 
    shopsID, 
    campaignId: id, 
    isEdit 
  });

  let campaign: CampaignRow | null = null;
  let programs: ProgramSummary[] = [];

  if (isEdit && id) {
    try {
      console.log('[Campaign Loader] Fetching campaign:', {
        shopsID,
        campaignId: id,
      });

  const flash = await getFlashMessage(request);

      const result = await getShopSingleCampaign(shopsID, Number(id));
      
      console.log('[Campaign Loader] Result received:', {
        hasCampaign: !!result.campaign,
        campaignId: result.campaign?.id,
        campaignName: result.campaign?.name,
        programsCount: result.programs?.length || 0,
      });

      campaign = result.campaign;
      programs = result.programs as ProgramSummary[];

      if (!campaign) {
        // ✅ Throw Response with friendly message
        throw new Response("Campaign not found", { 
          status: 404,
          statusText: "Campaign not found" 
        });
      }

      } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("campaign_not_found")) {
          throw new Response("We cannot seem to find that campaign", { 
            status: 404,
            statusText: "Campaign not found" 
          });
        }
      }
      // Re-throw for unexpected errors
      throw error;
    }
  }

  const { getEnumsServer } = await import("../lib/queries/supabase/getEnums.server");
  const enums = await getEnumsServer();
  const toOptions = (vals?: string[]): EnumOption[] =>
    (vals ?? []).map((v) => ({ label: v, value: v }));

  const campaignStatus = (enums.campaignStatus ?? []) as CampaignStatus[];
  const typeOptions = toOptions(enums.programGoal);
  const metricOptions = toOptions(enums.goalMetric);

  console.log('[Campaign Loader] Returning data:', {
    hasCampaign: !!campaign,
    programsCount: programs.length,
    isEdit,
  });

  return json<LoaderData>({
    campaign,
    programs,
    campaignStatus,
    typeOptions,
    metricOptions,
    isEdit,
    flash,
    session: {
      shopsID: shopsID,
      shopDomain: session.shop,
    },
  });
};


export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserEmail } = await requireAuthContext(request);
  const { id } = params;
  const isEdit = id !== "new";
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  // Handle delete action (only available in edit mode)

  if (intent === "delete" && isEdit) {
    try {
      await deleteShopCampaignCascade(shopsID, Number(id));
      // ✅ Success message with redirect
      return redirectWithSuccess(
        "/app/campaigns", 
        "Campaign deleted successfully"
      );
    } catch (error) {
      // ✅ Error message with redirect
      return redirectWithError(
        "/app/campaigns",
        "Failed to delete campaign. Please try again."
      );
    }
  }

}

  const parseNullableNumber = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseGoals = (v: FormDataEntryValue | null) => {
    try {
      const arr = JSON.parse((v ?? "[]").toString()) as Array<{
        type: string; 
        metric: string; 
        value: string | number;
      }>;
      return arr.map(g => ({
        goal: g.type,        // Map 'type' to 'goal' for consistency
        metric: g.metric,
        value: Number(g.value ?? 0)
      }));
    } catch {
      return [];
    }
  };

  // ✅ BUILD ONE UNIFIED PAYLOAD
  const payload = {
    ...(isEdit && id && { id: Number(id) }),  // Include ID only if editing
    name: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? "",
    codePrefix: form.get("codePrefix")?.toString() ?? "",
    budget: parseNullableNumber(form.get("budget")),
    startDate: form.get("campaignStartDate")?.toString() || null,
    endDate: form.get("campaignEndDate")?.toString() || null,
    goals: parseGoals(form.get("campaignGoals")),
    isDefault: false,
    status: (form.get("status")?.toString() || "Draft") as any,
  };

  try {
    // ✅ ONE FUNCTION CALL - handles both create and update
    await upsertShopCampaign(shopsID, payload);
    return redirect(`/app/campaigns`);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} campaign` },
      { status: 400 }
    );
  }
};


export default function CampaignPage() {
  const {
    campaign,
    programs,
    typeOptions,
    metricOptions,
    campaignStatus,
    isEdit,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const submit = useSubmit();

  // Initialize form state with campaign data if editing
  const [form, setForm] = React.useState(() => {
    // Parse existing campaign goals properly
    const existingGoals = campaign?.goals;
    let parsedGoals: Array<{ type: string; metric: string; value: string | number }> = [];

    if (Array.isArray(existingGoals)) {
      parsedGoals = existingGoals.map(goal => {
        // Handle Json type from database - could be object or various types
        if (typeof goal === 'object' && goal !== null) {
          const g = goal as any; // Type assertion since Json type is too broad
          return {
            type: g.goal || g.type || "",
            metric: g.goalMetric || g.metric || "",
            value: g.goalValue || g.value || ""
          };
        }
        // Fallback for non-object types
        return { type: "", metric: "", value: "" };
      });
    }

    return {
      name: campaign?.name ?? "",
      description: campaign?.description ?? "",
      startDate: campaign?.startDate ?? "",
      endDate: campaign?.endDate ?? "",
      codePrefix: campaign?.codePrefix ?? "",
      status: campaign?.status ?? "Draft",
      budget: campaign?.budget === null || campaign?.budget === undefined ? "" : String(campaign.budget),
      goals: parsedGoals,
    };
  });

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleChange =
    (field: keyof typeof form) => (value: string) =>
      setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange =
    (field: "startDate" | "endDate") => (iso: string) =>
      setForm((prev) => ({ ...prev, [field]: iso }));

  const handleAddGoal = () =>
    setForm((prev) => ({
      ...prev,
      campaignGoals: [...prev.goals, { type: "", metric: "", value: "" }],
    }));

  const handleGoalChange = (
    index: number,
    key: "type" | "metric" | "value",
    value: string
  ) => {
    const updated = [...form.goals];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, campaignGoals: updated }));
  };

  const handleDeleteGoal = (index: number) => {
    const updated = [...form.goals];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, campaignGoals: updated }));
  };

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    submit(fd, { method: "post" });
  };

  const statusOptions = React.useMemo(
    () => (campaignStatus ?? []).map((s) => ({ label: s, value: s })),
    [campaignStatus]
  );

  const goalTypeOptions = React.useMemo(
    () => typeOptions.length > 0 ? typeOptions : [
      { label: "Gross Margin", value: "Gross Margin" },
      { label: "Average Order Value", value: "Average Order Value" },
      { label: "New Customers", value: "New Customers" },
      { label: "Conversion Rate", value: "Conversion Rate" },
      { label: "Unit Volume", value: "Unit Volume" }
    ], [typeOptions]
  );

  const goalMetricOptions = React.useMemo(
    () => metricOptions.length > 0 ? metricOptions : [
      { label: "Dollars", value: "Dollars" },
      { label: "Percent", value: "Percent" },
      { label: "Consumers", value: "Consumers" },
      { label: "Orders", value: "Orders" },
      { label: "Units", value: "Units" }
    ], [metricOptions]
  );

  const pageTitle = isEdit ? `Edit Campaign: ${campaign?.name ?? ""}` : "Create New Campaign";
  const submitText = isEdit ? "Save Changes" : "Create Campaign";

  return (
    <Page
      title={pageTitle}
      secondaryActions={isEdit ? [
        {
          content: "Delete campaign",
          onAction: () => setDeleteOpen(true),
          destructive: true,
          icon: DeleteIcon,
        },
      ] : []}
    >
      <Box paddingBlockEnd="300">
        <InlineStack gap="200" align="start">
          <Button
            variant="plain"
            onClick={() => navigate("/app/campaigns", { replace: true })}>
            Back to campaigns
          </Button>

        </InlineStack>
      </Box>

      <InlineGrid columns={['twoThirds', 'oneThird']} gap="500" alignItems="start">
        
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Campaign Details
            </Text>
            <RemixForm method="post" replace>
              <FormLayout>
                <input
                  type="hidden"
                  name="campaignGoals"
                  value={JSON.stringify(form.goals)}
                />
                <input type="hidden" name="campaignStartDate" value={form.startDate} />
                <input type="hidden" name="campaignEndDate" value={form.endDate} />

                <TextField
                  label="Campaign Name"
                  name="campaignName"
                  value={form.name}
                  onChange={handleChange("name")}
                  autoComplete="off"
                  requiredIndicator
                />

                <TextField
                  label="Campaign Description"
                  name="campaignDescription"
                  value={form.description}
                  onChange={handleChange("description")}
                  autoComplete="off"
                  multiline={3}
                />

                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  value={form.codePrefix}
                  onChange={handleChange("codePrefix")}
                  autoComplete="off"
                  helpText="Optional prefix for discount codes"
                />

                <Select
                  name="status"
                  label="Campaign Status"
                  options={statusOptions}
                  value={form.status}
                  onChange={handleChange("status")}
                  helpText="Current lifecycle state"
                />

                <TextField
                  label="Budget ($)"
                  name="budget"
                  type="number"
                  value={String(form.budget ?? "")}
                  onChange={handleChange("budget")}
                  autoComplete="off"
                  inputMode="decimal"
                />

                <FormLayout.Group>
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
                </FormLayout.Group>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">
                          Campaign Goals (Optional)
                        </Text>
                        <Button 
                          icon={PlusIcon} 
                          onClick={handleAddGoal} 
                          variant="plain"
                          size="slim"
                        >
                          Add Goal
                        </Button>
                      </InlineStack>

                      {form.goals.length === 0 ? (
                        <Text as="p" tone="subdued" variant="bodySm">
                          Add one or more goals to track campaign success.
                        </Text>
                      ) : (
                        <BlockStack gap="300">
                          {form.goals.map((goal, index) => (
                            <Card key={index} padding="400">
                              <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
                      
                                <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                                  <Select
                                    label="Type"
                                    options={goalTypeOptions}
                                    value={String(goal.type ?? "")}
                                    onChange={(v) => handleGoalChange(index, "type", v)}
                                  />
                                </div>
                          
                            
                                <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                                  <Select
                                    label="Metric"
                                    options={goalMetricOptions}
                                    value={String(goal.metric ?? "")}
                                    onChange={(v) => handleGoalChange(index, "metric", v)}
                                  />
                                </div>
                    
                    
                                <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                                  <TextField
                                    label="Value"
                                    type="number"
                                    value={String(goal.value ?? "")}
                                    onChange={(v) => handleGoalChange(index, "value", v)}
                                    autoComplete="off"
                                    inputMode="decimal"
                                  />
                                </div>
                          
                 
                                <div style={{ flex: "0 0 auto", paddingTop: "28px" }}>
                                  <Button
                                    icon={DeleteIcon}
                                    variant="plain"
                                    tone="critical"
                                    onClick={() => handleDeleteGoal(index)}
                                    accessibilityLabel="Delete goal"
                                  />
                                </div>
                              </InlineStack>
                            </Card>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>
                  <InlineStack gap="300" align="start">
                  <Button submit variant="primary" loading={isSubmitting}>
                    {submitText}
                  </Button>
                  {isEdit && (
                    <Button
                      tone="critical"
                      onClick={() => setDeleteOpen(true)}
                      icon={DeleteIcon}
                    >
                      Delete
                    </Button>
                  )}
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            {isEdit ? (
              <>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Programs in this Campaign
                  </Text>
                  <Link to={`/app/programs/new?campaignId=${campaign!.id}`}>
                    <Button variant="primary" icon={PlusIcon}>
                      Create Program
                    </Button>
                  </Link>
                </InlineStack>

                {programs.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No programs yet. Create your first program to get started.
                  </Text>
                ) : (
                  <BlockStack gap="200">
                    {programs.map((p) => (
                      <Card key={p.id} padding="300">
                        <InlineStack align="space-between" blockAlign="center" wrap={false}>
                          <BlockStack gap="050">
                            <Text as="h3" variant="headingSm">
                              {p.name || `Program #${p.id}`}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {formatRange(p.startDate ?? undefined, p.endDate ?? undefined)}
                            </Text>
                            {p.focus && (
                              <Text as="p" variant="bodySm">
                                Focus: {p.focus}
                              </Text>
                            )}
                          </BlockStack>
                          <InlineStack gap="200" blockAlign="center">
                            <Badge tone={badgeToneForStatus(p.status ?? undefined)}>
                              {p.status ?? "Draft"}
                            </Badge>
                            <Link to={`/app/campaigns/programs/${p.id}`}>
                              <Button variant="secondary" size="slim">Edit</Button>
                            </Link>
                          </InlineStack>
                        </InlineStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </>
            ) : (
              <>
                <Text as="h2" variant="headingMd">
                  About Programs
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  After creating your campaign, you'll be able to add programs that define specific
                  offer rules, discount parameters, and targeting criteria for your customer-generated offers.
                </Text>
              </>
            )}
          </BlockStack>
        </Card>
      </InlineGrid>


      {isEdit && (
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete campaign?"
          primaryAction={{
            content: "Delete campaign",
            destructive: true,
            onAction: confirmDelete,
            loading: isSubmitting,
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setDeleteOpen(false) }
          ]}
        >
          <Modal.Section>
            <Text as="p">
              This will permanently delete this campaign and all associated programs.
              This action cannot be undone.
            </Text>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}


function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (isoString: string) => void;
}) {
  const [dateVal, setDateVal] = React.useState("");
  const [timeVal, setTimeVal] = React.useState("12:00");

  // Initialize from prop value when component mounts or value changes
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Format to YYYY-MM-DD for date input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setDateVal(`${year}-${month}-${day}`);

        // Format to HH:MM for time input
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setTimeVal(`${hours}:${minutes}`);
      }
    } else {
      setDateVal("");
      setTimeVal("12:00");
    }
  }, [value]);

  // Update ISO string when date/time changes
  React.useEffect(() => {
    if (dateVal && timeVal) {
      const iso = new Date(`${dateVal}T${timeVal}:00`).toISOString();
      onChange(iso);
    } else {
      onChange("");
    }
  }, [dateVal, timeVal, onChange]);

  return (
    <InlineStack gap="200">
      <TextField
        label={`${label} (Date)`}
        type="date"
        value={dateVal}
        onChange={setDateVal}
        autoComplete="off"
      />
      <TextField
        label={`${label} (Time)`}
        type="time"
        value={timeVal}
        onChange={setTimeVal}
        autoComplete="off"
      />
    </InlineStack>
  );
}


function formatRange(startISO?: string, endISO?: string) {
  const s = startISO ? formatDateTime(startISO) : "";
  const e = endISO ? formatDateTime(endISO) : "";
  if (s && e) return `${s} — ${e}`;
  if (s) return s;
  if (e) return e;
  return "No dates set";
}

function badgeToneForStatus(
  status?: string
): "success" | "warning" | "critical" | "attention" | "info" | undefined {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "PAUSED") return "warning";
  if (s === "ARCHIVED") return "critical";
  if (s === "DRAFT") return "info";
  return undefined;
}

*/