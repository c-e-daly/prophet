// app/routes/app.programs.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm, useSubmit,} from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack, Select,
  Text, Modal, InlineGrid, Link, Badge, DataTable,} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { PROGRAM_STATUS_OPTIONS, PROGRAM_FOCUS_OPTIONS, PROGRAM_GOAL_OPTIONS,  GOAL_METRIC_OPTIONS,
  YES_NO_OPTIONS,  type ProgramRow,  type ProgramGoalsRow,  type CampaignRow,  type UpsertProgramPayload,
  ProgramStatusEnum,
} from "../lib/types/dbTables";
import { DateTimeField } from "../components/dateTimeField";
import { badgeToneForStatus, formatRange } from "../utils/statusHelpers";
import { formatCurrencyUSD } from "../utils/format";
import { getShopSingleProgram } from "../lib/queries/supabase/getShopSingleProgram";
import { upsertShopProgram } from "../lib/queries/supabase/upsertShopProgram";
import { deleteShopProgram } from "../lib/queries/supabase/deleteShopProgram";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess, redirectWithError } from "../utils/flash.server";
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ============================================================================
// Types
// ============================================================================

type LoaderData = {
  program: ProgramRow;
  campaign: CampaignRow;
  programGoals: ProgramGoalsRow[]; // ALWAYS an array
  siblingPrograms: ProgramRow[];
  flash: { type: "success" | "error" | "info" | "warning"; message: string } | null;
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const { id } = params;
  const flash = await getFlashMessage(request);

  try {
    const result = await getShopSingleProgram(shopsID, Number(id));
      if (!result.program) return redirectWithError("/app/campaigns", "Program not found.");
      if (!result.campaign) return redirectWithError("/app/campaigns", "Campaign not found for this program.");

   const campaigns = result.campaign as CampaignRow | unknown;
      
    // Sibling programs
    const allPrograms: ProgramRow[] = Array.isArray(result.program) ? result.program : [];
    const siblingPrograms = allPrograms.filter((p) => p.id !== result.program?.id);
 
  return json({
  program: result.program,
  campaign: result.campaign,
  programGoals: result.programGoals,       
  siblingPrograms: result.siblingPrograms, 
  flash,
} satisfies LoaderData);

  } catch (error) {
    return redirectWithError("/app/campaigns", "Unable to load program.");
  }
};

// ============================================================================
// Action
// ============================================================================

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName } = await requireAuthContext(request);
  const { id } = params;
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  if (intent === "delete") {
    try {
      const campaignId = form.get("campaignId")?.toString();
      await deleteShopProgram(shopsID, Number(id));
      return campaignId
        ? redirectWithSuccess(`/app/campaigns/${campaignId}`, "Program deleted successfully")
        : redirectWithSuccess("/app/campaigns", "Program deleted successfully");
    } catch (error) {
      return redirectWithError("/app/campaigns", "Failed to delete program.");
    }
  }

  // helpers
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
  const focusRaw  = strOrUndef(form.get("programFocus"));
    

  // Build payload
  const payload: UpsertProgramPayload = {
    id: Number(id),
    campaigns: num(form.get("campaigns")) ?? undefined,
    name: str(form.get("programName")) || "",
    description: str(form.get("programDescription")) || null,
    startDate: str(form.get("programStartDate")) || null,
    endDate: str(form.get("programEndDate")) || null,
    status: pickFrom(statusRaw, PROGRAM_STATUS_OPTIONS) as any, 
    focus:  pickFrom(focusRaw,  PROGRAM_FOCUS_OPTIONS) ?? null as any,    
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

  try {
    await upsertShopProgram(shopsID, payload);
    return payload.campaigns
      ? redirectWithSuccess(`/app/campaigns/${payload.campaigns}`, "Program updated successfully")
      : redirectWithSuccess("/app/campaigns", "Program updated successfully");
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to update program" },
      { status: 400 }
    );
  }
};

// ============================================================================
// Component
// ============================================================================

export default function ProgramPage() {
  const { program, campaign, programGoals, siblingPrograms, flash } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  // pick recommended goal (by isRecommended flag if present) → else first → else empty
  const recommended = React.useMemo(() => {
    const withFlag = programGoals.find((g) => (g as any).isRecommended === true);
    return withFlag ?? programGoals[0] ?? null;
  }, [programGoals]);

  // Local form state (Polaris Selects must always get strings, not null)
  const [form, setForm] = React.useState(() => ({
    name: program.name ?? "",
    description: program.description ?? "",
    startDate: program.startDate ?? "",
    endDate: program.endDate ?? "",
    status: (program.status ?? "Draft") as string,
    focus: (program.focus ?? "") as string,
    codePrefix: program.codePrefix ?? "",
    acceptRate: program.acceptRate != null ? String(program.acceptRate) : "",
    declineRate: program.declineRate != null ? String(program.declineRate) : "",
    expiryMinutes: program.expiryMinutes != null ? String(program.expiryMinutes) : "",
    combineOrderDiscounts: program.combineOrderDiscounts ? "true" : "false",
    combineProductDiscounts: program.combineProductDiscounts ? "true" : "false",
    combineShippingDiscounts: program.combineShippingDiscounts ? "true" : "false",

    // recommended goal fields for edit
    goalType: recommended?.goalType ?? "",
    goalMetric: recommended?.goalMetric ?? "",
    goalValue: recommended?.goalValue != null ? String(recommended.goalValue) : "",
    goalId: recommended?.id != null ? String(recommended.id) : "",
  }));

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("campaignId", String(campaign.id));
    submit(fd, { method: "post" });
  };

  // Render table of *other* goals (read-only)
  const otherGoals = programGoals.filter((g) => String(g.id) !== form.goalId);
  const goalsRows = otherGoals.map((g) => [
    g.goalType ?? "-",
    g.goalMetric ?? "-",
    g.goalValue != null ? String(g.goalValue) : "-",
    new Date(g.created_at).toLocaleString(),
  ]);

  return (
    <Page
      title={`Edit Program: ${program.name ?? ""}`}
      backAction={{ onAction: () => navigate(`/app/campaigns/${campaign.id}`) }}
      secondaryActions={[
        {
          content: "Delete program",
          onAction: () => setDeleteOpen(true),
          destructive: true,
          icon: DeleteIcon,
        },
      ]}
    >
      <FlashBanner flash={flash} />

      <InlineGrid columns={["twoThirds", "oneThird"]} gap="500" alignItems="start">
        {/* LEFT: editor */}
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
                  helpText="Programs cannot be moved between campaigns"
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

                <FormLayout.Group>
                  <Select
                    name="status"
                    label="Status"
                    options={PROGRAM_STATUS_OPTIONS}
                    value={form.status}
                    onChange={handleChange("status")}
                    requiredIndicator
                  />
                  <Select
                    name="programFocus"
                    label="Focus"
                    options={PROGRAM_FOCUS_OPTIONS}
                    value={form.focus}
                    onChange={handleChange("focus")}
                  />
                </FormLayout.Group>

                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  value={form.codePrefix}
                  onChange={handleChange("codePrefix")}
                  autoComplete="off"
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

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Offer Evaluation
                  </Text>
                  <FormLayout.Group>
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
                  </FormLayout.Group>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Recommended Goal
                  </Text>
                  <FormLayout.Group>
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
                    <input type="hidden" name="goalId" value={form.goalId} />
                  </FormLayout.Group>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Combine Discounts
                  </Text>
                  <FormLayout.Group>
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
                  </FormLayout.Group>
                </BlockStack>

                <InlineStack gap="300">
                  <Button submit variant="primary">
                    Save Changes
                  </Button>
                  <Button tone="critical" onClick={() => setDeleteOpen(true)} icon={DeleteIcon}>
                    Delete
                  </Button>
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        {/* RIGHT: context cards */}
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Campaign
              </Text>
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
                      <Text as="span" variant="bodySm" tone="subdued">
                        Budget:
                      </Text>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        {formatCurrencyUSD((campaign.budget ?? 0) * 100)}
                      </Text>
                    </InlineStack>
                  )}
                  <Link onClick={() => navigate(`/app/campaigns/${campaign.id}`)}>
                    View Campaign
                  </Link>
                </BlockStack>
              </Card>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Other Programs
                </Text>
                <Button
                  variant="plain"
                  size="slim"
                  onClick={() => navigate(`/app/programs/new?campaignId=${campaign.id}`)}
                >
                  Add
                </Button>
              </InlineStack>

              {siblingPrograms.length === 0 ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  No other programs yet.
                </Text>
              ) : (
                <BlockStack gap="200">
                  {siblingPrograms.map((p) => (
                    <Link key={p.id} onClick={() => navigate(`/app/programs/${p.id}`)} removeUnderline>
                      <Card padding="300">
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodySm">{p.name || `Program #${p.id}`}</Text>
                          <Badge tone={badgeToneForStatus(p.status ?? "")}>{p.status}</Badge>
                        </InlineStack>
                      </Card>
                    </Link>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">All Goals</Text>
              {programGoals.length === 0 ? (
                <Text as="p" variant="bodySm" tone="subdued">No goals yet.</Text>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["Type", "Metric", "Value", "Created"]}
                  rows={goalsRows}
                />
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete program?"
        primaryAction={{
          content: "Delete program",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setDeleteOpen(false) }]}
      >
        <Modal.Section>
          <Text as="p">This will permanently delete this program. This action cannot be undone.</Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export { ErrorBoundary };

/*
// app/routes/app.campaigns.programs.$id.tsx
import * as React from "react";
import { json, redirect, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation, useActionData } from "@remix-run/react";
import {  Page, Card, FormLayout, TextField, Button, Select, InlineGrid,
  BlockStack, Banner, Text, Box, Link as PolarisLink, InlineStack, type SelectProps
} from "@shopify/polaris";
import type { Tables } from "../lib/types/dbTables";
import { getShopSingleProgram, } from "../lib/queries/supabase/getShopSingleProgram";
import { upsertShopProgram } from "../lib/queries/supabase/upsertShopProgram";
import { deleteShopProgram} from "../lib/queries/supabase/deleteShopProgram";
import { getEnumsServer, type EnumMap } from "../lib/queries/supabase/getEnums.server";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { recordUserActivity } from "../lib/queries/supabase/recordUserActivity";

// ---------- TYPES ----------
type Campaign = Pick<Tables<"campaigns">, "id" | "name">;
type Program = Tables<"programs">;

type LoaderData = {
  program: Program;
  campaigns: Campaign[];
  enums: EnumMap; // Record<string, string[]>;
  shopSession: {
    shopDomain: string;
    shopsID: number;  //supabase row id
    createdByUser: number | undefined;
    createdByUserName: string | undefined;
  }
};

const YES_NO_OPTIONS: SelectProps["options"] = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];


// ---------------- LOADER ----------------
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, currentUserId,currentUserName, session} = await getAuthContext(request);  
  const {id} = params;

  if (!id) throw new Response("Missing program id", { status: 400 });

  const { program, campaigns } = await getShopSingleProgram(shopsID, Number(id));
  const enums = await getEnumsServer();

  return json<LoaderData>({
    program,
    campaigns,
    enums,
    shopSession: {
      shopDomain: session.shop,
      shopsID: shopsID,
      createdByUser: currentUserId,
      createdByUserName: currentUserName
    }
  });
}

// ---------------- ACTION ----------------
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName, currentUserEmail } = await requireAuthContext(request);
  const { id } = params;
  const isEdit = id !== "new";
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  // Handle delete action (only available in edit mode)
  if (intent === "delete" && isEdit) {
    await deleteShopProgram(shopsID, Number(id));
    return redirect(`/app/campaigns?deleted=${id}`);
  }

  const parseNullableNumber = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

 const campaignsValue = parseNullableNumber(form.get("campaigns"));

  // BUILD ONE UNIFIED PAYLOAD
  const payload = {
    ...(isEdit && id && { id: Number(id) }),  // Include ID only if editing
    ...(campaignsValue !== null && { campaigns: campaignsValue }),  // Only include if not null
    name: form.get("programName")?.toString() ?? "",
    description: form.get("programDescription")?.toString() ?? "",
    startDate: form.get("programStartDate")?.toString() || null,
    endDate: form.get("programEndDate")?.toString() || null,
    status: (form.get("status")?.toString() || "Draft") as any,
    budgetGoal: parseNullableNumber(form.get("budgetGoal")),
    offerGoal: parseNullableNumber(form.get("offerGoal")),
    revenueGoal: parseNullableNumber(form.get("revenueGoal")),
    isDefault: form.get("isDefault") === "true",
    createdByUser: currentUserId,
    createdByUserName: currentUserName,
  };

  try {
    // ONE FUNCTION CALL CREATE AND UPDATE
    await upsertShopProgram(shopsID, payload);
    
    // Redirect back to campaign if we know which one, otherwise campaigns list
    const campaignId = payload.campaigns;
    if (campaignId) {
      return redirect(`/app/campaigns/${campaignId}`);
    }
    return redirect(`/app/campaigns`);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} program` },
      { status: 400 }
    );
  }
};

// ---------------- COMPONENT ----------------
export default function ProgramEditCreate() {
  const { program, campaigns, enums, shopSession } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Build Select options from enums (support both snake_case and camelCase)
  const statusList = enums["program_status"] ?? enums["programStatus"] ?? [];
  const focusList = enums["program_focus"] ?? enums["programFocus"] ?? [];

  const statusOptions: SelectProps["options"] =
    statusList.map((v: string) => ({ label: v, value: v }));

  const focusOptions: SelectProps["options"] =
    focusList.map((v: string) => ({ label: v, value: v }));

  const campaignOptions: SelectProps["options"] = React.useMemo(
    () => [
      { label: "Select a campaign", value: "" },
      ...campaigns.map((c) => ({
        label: c.name ?? "—",
        value: String(c.id),
      })),
    ],
    [campaigns]
  );

  // Controlled state from existing program values
  const [campaignId, setCampaignId] = React.useState(
    program.campaigns ? String(program.campaigns) : ""  );
  const [programName, setProgramName] = React.useState(program.name ?? "");
  const [status, setStatus] = React.useState<string>(program.status ?? "");
  const [programFocus, setProgramFocus] = React.useState<string>(program.focus ?? "");
  const [startDate, setStartDate] = React.useState(program.startDate || "");
  const [endDate, setEndDate] = React.useState(program.endDate || "");
  const [codePrefix, setCodePrefix] = React.useState(program.codePrefix ?? "");
  const [acceptRate, setAcceptRate] = React.useState(
    program.acceptRate != null ? String(program.acceptRate) : ""  );
  const [declineRate, setDeclineRate] = React.useState(
    program.declineRate != null ? String(program.declineRate) : "" );
  const [expiryTimeMinutes, setExpiryTimeMinutes] = React.useState(
    program.expiryMinutes != null ? String(program.expiryMinutes) : ""  );
  const [combineOrder, setCombineOrder] = React.useState(program.combineOrderDiscounts ? "true" : "false");
  const [combineProduct, setCombineProduct] = React.useState(program.combineProductDiscounts ? "true" : "false");
  const [combineShipping, setCombineShipping] = React.useState(program.combineShippingDiscounts ? "true" : "false");

  return (
    <Page title={`Edit Program: ${program.name ?? ""}`} backAction={{ url: "/app/campaigns" }}>
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>Error updating program: {actionData.error}</p>
          </Banner>
        )}

        <Card>
          <form method="post">
            <FormLayout>
              
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />

              <Select
                label="Campaign"
                name="campaignId"
                options={campaignOptions}
                value={campaignId}
                onChange={setCampaignId}
                requiredIndicator
              />

              <TextField
                label="Program Name"
                name="programName"
                autoComplete="off"
                value={programName}
                onChange={setProgramName}
                requiredIndicator
              />

              <Select
                label="Status"
                name="status"
                options={statusOptions}
                value={status}
                onChange={setStatus}
                requiredIndicator
              />

              <FormLayout.Group>
                <DateTimeField
                  label="Start Date & Time"
                  name="startDate"
                  value={program.startDate || ""}
                  onChange={setStartDate}
                />
                <DateTimeField
                  label="End Date & Time"
                  name="endDate"
                  value={program.endDate || ""}
                  onChange={setEndDate}
                />
              </FormLayout.Group>

              <FormLayout.Group>
                <Select
                  label="Program Focus"
                  name="programFocus"
                  options={focusOptions}
                  value={programFocus}
                  onChange={setProgramFocus}
                  requiredIndicator
                />
                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  autoComplete="off"
                  value={codePrefix}
                  onChange={setCodePrefix}
                  helpText="Optional prefix for discount codes"
                />
              </FormLayout.Group>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Offer Evaluation Settings</Text>
                <FormLayout.Group>
                  <TextField
                    label="Accept Rate (%)"
                    name="acceptRate"
                    type="number"
                    min="0"
                    max="100"
                    autoComplete="off"
                    value={acceptRate}
                    onChange={setAcceptRate}
                  />
                  <TextField
                    label="Decline Rate (%)"
                    name="declineRate"
                    type="number"
                    min="0"
                    max="100"
                    autoComplete="off"
                    value={declineRate}
                    onChange={setDeclineRate}
                  />
                  <TextField
                    label="Expiry Time (Minutes)"
                    name="expiryTimeMinutes"
                    type="number"
                    min="1"
                    autoComplete="off"
                    value={expiryTimeMinutes}
                    onChange={setExpiryTimeMinutes}
                  />
                </FormLayout.Group>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Combine Discount Settings</Text>
                <InlineGrid columns="1fr 1fr 1fr" gap="400">
                  <Select
                    label="Order Discounts"
                    name="combineOrderDiscounts"
                    options={YES_NO_OPTIONS}
                    value={combineOrder}
                    onChange={setCombineOrder}
                  />
                  <Select
                    label="Product Discounts"
                    name="combineProductDiscounts"
                    options={YES_NO_OPTIONS}
                    value={combineProduct}
                    onChange={setCombineProduct}
                  />
                  <Select
                    label="Shipping Discounts"
                    name="combineShippingDiscounts"
                    options={YES_NO_OPTIONS}
                    value={combineShipping}
                    onChange={setCombineShipping}
                  />
                </InlineGrid>
              </BlockStack>

              <InlineGrid columns="auto auto" gap="400">
                <Button submit variant="primary" loading={isSubmitting}>
                  Save Changes
                </Button>
                <Button url="/app/programs">Cancel</Button>
              </InlineGrid>
            </FormLayout>
          </form>
        </Card>
      </BlockStack>
    </Page>
  );
}


function DateTimeField({
  label,
  name, // kept for parity; actual submit is via hidden input above
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (isoString: string) => void;
}) {
  const [dateVal, setDateVal] = React.useState(value?.slice(0, 10) || "");
  const [timeVal, setTimeVal] = React.useState(value?.slice(11, 16) || "12:00");

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
      <TextField label={`${label} (Date)`} type="date" value={dateVal} onChange={setDateVal} autoComplete="off" />
      <TextField label={`${label} (Time)`} type="time" value={timeVal} onChange={setTimeVal} autoComplete="off" />
    </InlineStack>
  );
}
*/