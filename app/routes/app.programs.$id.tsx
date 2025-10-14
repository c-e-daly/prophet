// app/routes/app.programs.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm, useSubmit } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, Modal, InlineGrid, Link, Badge } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { PROGRAM_STATUS_OPTIONS, PROGRAM_FOCUS_OPTIONS, GOAL_METRIC_OPTIONS,
  type ProgramRow,  type CampaignRow,  type UpsertProgramPayload } from "../lib/types/dbTables";
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
  siblingPrograms: ProgramRow[];
  flash: { type: "success" | "error" | "info" | "warning"; message: string; } | null;
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, session } = await getAuthContext(request);
  const { id } = params;
  const flash = await getFlashMessage(request);

  try {
    const result = await getShopSingleProgram(shopsID, Number(id));
    
    if (!result.program) {
      console.error('[Program Loader] Program not found:', {
        programId: id,
        shopsID,
        timestamp: new Date().toISOString(),
        requestUrl: request.url,
      });
      return redirectWithError("/app/campaigns", "Program not found.");
    }

    // Extract campaign from the result - adjust based on your actual query structure
    const campaign = Array.isArray(result.campaigns) && result.campaigns.length > 0 
      ? result.campaigns[0] 
      : null;
    
    if (!campaign) {
      console.error('[Program Loader] Campaign not found for program:', {
        programId: id,
        campaignId: result.program.campaigns,
        shopsID,
        timestamp: new Date().toISOString(),
      });
      return redirectWithError("/app/campaigns", "Campaign not found for this program.");
    }

    // Get all programs for this campaign to show siblings
    const allPrograms = result.programs || [];
    const siblingPrograms = allPrograms.filter((p: ProgramRow) => p.id !== result.program.id);

    return json<LoaderData>({
      program: result.program,
      campaign,
      siblingPrograms,
      flash,
    });
  } catch (error) {
    console.error('[Program Loader] Error:', {
      programId: id,
      shopsID,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
    });
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
      console.error('[Program Action] Delete error:', {
        programId: id,
        shopsID,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      return redirectWithError("/app/campaigns", "Failed to delete program.");
    }
  }

  const parseNum = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const payload: UpsertProgramPayload = {
    id: Number(id),
    campaigns: parseNum(form.get("campaigns")),
    name: form.get("programName")?.toString() ?? "",
    description: form.get("programDescription")?.toString() ?? null,
    startDate: form.get("programStartDate")?.toString() || null,
    endDate: form.get("programEndDate")?.toString() || null,
    status: form.get("status")?.toString() as any,
    focus: form.get("programFocus")?.toString() ?? null,
    codePrefix: form.get("codePrefix")?.toString() ?? null,
    acceptRate: parseNum(form.get("acceptRate")),
    declineRate: parseNum(form.get("declineRate")),
    expiryMinutes: parseNum(form.get("expiryMinutes")),
    combineOrderDiscounts: form.get("combineOrderDiscounts") === "true",
    combineProductDiscounts: form.get("combineProductDiscounts") === "true",
    combineShippingDiscounts: form.get("combineShippingDiscounts") === "true",
    budgetGoal: parseNum(form.get("budgetGoal")),
    offerGoal: parseNum(form.get("offerGoal")),
    revenueGoal: parseNum(form.get("revenueGoal")),
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
    console.error('[Program Action] Update error:', {
      programId: id,
      shopsID,
      payload,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : String(error),
      timestamp: new Date().toISOString(),
    });
    
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
  const { program, campaign, siblingPrograms, flash } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [form, setForm] = React.useState(() => ({
    name: program.name ?? "",
    description: program.description ?? "",
    startDate: program.startDate ?? "",
    endDate: program.endDate ?? "",
    status: program.status ?? "Draft",
    focus: program.focus ?? "",
    codePrefix: program.codePrefix ?? "",
    acceptRate: program.acceptRate != null ? String(program.acceptRate) : "",
    declineRate: program.declineRate != null ? String(program.declineRate) : "",
    expiryMinutes: program.expiryMinutes != null ? String(program.expiryMinutes) : "",
    combineOrderDiscounts: program.combineOrderDiscounts ? "true" : "false",
    combineProductDiscounts: program.combineProductDiscounts ? "true" : "false",
    combineShippingDiscounts: program.combineShippingDiscounts ? "true" : "false",
    budgetGoal: program.budgetGoal != null ? String(program.budgetGoal) : "",
    offerGoal: program.offerGoal != null ? String(program.offerGoal) : "",
    revenueGoal: program.revenueGoal != null ? String(program.revenueGoal) : "",
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

      <InlineGrid columns={['twoThirds', 'oneThird']} gap="500" alignItems="start">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Program Details</Text>
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
                  <Text as="h3" variant="headingSm">Offer Evaluation</Text>
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
                  <Text as="h3" variant="headingSm">Goals</Text>
                  <FormLayout.Group>
                    <TextField
                      label="Budget ($)"
                      name="budgetGoal"
                      type="number"
                      value={form.budgetGoal}
                      onChange={handleChange("budgetGoal")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Offers"
                      name="offerGoal"
                      type="number"
                      value={form.offerGoal}
                      onChange={handleChange("offerGoal")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Revenue ($)"
                      name="revenueGoal"
                      type="number"
                      value={form.revenueGoal}
                      onChange={handleChange("revenueGoal")}
                      autoComplete="off"
                    />
                  </FormLayout.Group>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Combine Discounts</Text>
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
                  <Button submit variant="primary">Save Changes</Button>
                  <Button tone="critical" onClick={() => setDeleteOpen(true)} icon={DeleteIcon}>
                    Delete
                  </Button>
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        <BlockStack gap="400">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Campaign</Text>
              <Card background="bg-surface-secondary" padding="300">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" fontWeight="semibold">{campaign.name}</Text>
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
                <Text as="h2" variant="headingMd">Other Programs</Text>
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
                          <Badge tone={badgeToneForStatus(p.status ?? "")}>
                            {p.status}
                          </Badge>
                        </InlineStack>
                      </Card>
                    </Link>
                  ))}
                </BlockStack>
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