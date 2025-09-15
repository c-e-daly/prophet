// app/routes/app.campaigns.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, useSearchParams, Form as RemixForm, useActionData, useParams } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack, Text, Layout, Banner, Select } from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { createShopCampaign } from "../lib/queries/supabase/createShopCampaign";
import { updateShopCampaign } from "../lib/queries/supabase/updateShopCampaign"; // You'll need to create this
import { getShopSingleCampaign } from "../lib/queries/supabase/getShopSingleCampaign"; // You'll need to create this
import { formatUSD, isoToLocalInput } from "../utils/format";
import type { Tables } from "../lib/types/dbTables";
import { toOptions } from "../lib/types/enumTypes";
import { getEnumsServer, type EnumMap } from "../lib/queries/supabase/getEnums.server";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";

type CampaignRow = Tables<"campaigns">;
type CampaignStatus = CampaignRow["status"];

type LoaderData = {
  shopDomain: string;
  shopsID: number;
  campaign: CampaignRow | null;
  isEdit: boolean;
  enums: EnumMap;
};

type ActionData = {
  error?: string;
};

// ---------- Loader ----------
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);
  const { id } = params;
  
  const enums = await getEnumsServer();
  const isEdit = id !== "new";
  let campaign: CampaignRow | null = null;

  if (isEdit && id) {
    try {
      campaign = await getShopSingleCampaign(shopsID, parseInt(id));
      if (!campaign) {
        throw new Response("Campaign not found", { status: 404 });
      }
    } catch (error) {
      throw new Response("Campaign not found", { status: 404 });
    }
  }

  return json<LoaderData>({
    shopDomain: session.shop,
    shopsID: shopsID,
    campaign,
    isEdit,
    enums,
  });
};

// ---------- Action ----------
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);
  const { id } = params;
  const isEdit = id !== "new";
  
  const form = await request.formData();
  const toStr = (v: FormDataEntryValue | null) => (v ? v.toString().trim() : "");
  const toNum = (v: FormDataEntryValue | null) => Number(v ?? 0);

  type CampaignGoal = { goal: string; metric: string; value: number };
  const parseGoals = (): CampaignGoal[] => {
    try {
      const raw = toStr(form.get("campaignGoals")) || "[]";
      const arr = JSON.parse(raw) as Array<{ type: string; metric: string; value: string | number }>;
      return arr.map((g) => ({
        goal: g.type,
        metric: g.metric,
        value: Number(g.value ?? 0),
      }));
    } catch {
      return [];
    }
  };

  // Validate status against enums
  const enums = await getEnumsServer();
  const statusRaw = toStr(form.get("status")) || "Draft";
  const status: CampaignStatus = (enums.campaignStatus?.includes(statusRaw) ? statusRaw : "Draft") as CampaignStatus;

  const campaignData = {
    shopsID: shopsID,
    campaignName: toStr(form.get("campaignName")),
    description: toStr(form.get("campaignDescription")) || null,
    codePrefix: toStr(form.get("codePrefix")) || null,
    budget: toNum(form.get("budget")) || 0,
    startDate: toStr(form.get("campaignStartDate")) || null,
    endDate: toStr(form.get("campaignEndDate")) || null,
    campaignGoals: parseGoals(),
    status,
    isDefault: false,
  };

  try {
    if (isEdit && id) {
      // Update existing campaign
      await updateShopCampaign(shopsID, parseInt(id), campaignData);
    } else {
      // Create new campaign
      await createShopCampaign(campaignData);
    }

    return redirect(`/app/campaigns`);
  } catch (error) {
    return json<ActionData>(
      { error: error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} campaign` },
      { status: 400 }
    );
  }
};

// ---------- Component ----------
export default function CampaignPage() {
  const { shopDomain, campaign, isEdit, enums } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const [sp] = useSearchParams();
  const backTo = sp.toString() ? `/app/campaigns?${sp.toString()}` : "/app/campaigns";

  type UIGoal = { type: string; metric: string; value: string };
  
  // Initialize form with campaign data if editing
  const [form, setForm] = React.useState({
    campaignName: campaign?.campaignName || "",
    campaignDescription: campaign?.description || "",
    campaignStartDate: campaign?.startDate ? isoToLocalInput(campaign.startDate) : "",
    campaignEndDate: campaign?.endDate ? isoToLocalInput(campaign.endDate) : "",
    codePrefix: campaign?.codePrefix || "",
    budget: campaign?.budget || 0,
    status: campaign?.status || "Draft",
    campaignGoals: (campaign?.campaignGoals as UIGoal[]) || [],
  });

  const handleChange =
    (field: keyof typeof form) =>
      (value: string | number) =>
        setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange =
    (field: "campaignStartDate" | "campaignEndDate") => (iso: string) =>
      setForm((prev) => ({ ...prev, [field]: iso }));

  const handleAddGoal = () =>
    setForm((prev) => ({
      ...prev,
      campaignGoals: [...prev.campaignGoals, { type: "", metric: "", value: "" }],
    }));

  const handleGoalChange = (index: number, key: "type" | "metric" | "value", value: string) => {
    const updated = [...form.campaignGoals];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, campaignGoals: updated }));
  };

  const handleDeleteGoal = (index: number) => {
    const updated = [...form.campaignGoals];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, campaignGoals: updated }));
  };

  const statusOptions = toOptions(enums.campaignStatus || []);
  const goalTypeOptions = toOptions(enums.goalTypes || []);
  const goalMetricOptions = toOptions(enums.goalMetrics || []);

  const pageTitle = isEdit ? `Edit Campaign: ${campaign?.campaignName}` : "Create A Campaign";
  const submitText = isEdit ? "Update Campaign" : "Create Campaign";

  return (
    <Page title={pageTitle} subtitle={shopDomain}>
      <Layout>
        <Layout.Section variant="oneHalf">
          <BlockStack gap="500">
            {actionData?.error && (
              <Banner tone="critical">
                <p>Error {isEdit ? 'updating' : 'creating'} campaign: {actionData.error}</p>
              </Banner>
            )}

            <Card>
              <RemixForm method="post" replace>
                <FormLayout>
                  {/* Hidden inputs for date/time + goals */}
                  <input type="hidden" name="campaignGoals" value={JSON.stringify(form.campaignGoals)} />
                  <input type="hidden" name="campaignStartDate" value={form.campaignStartDate} />
                  <input type="hidden" name="campaignEndDate" value={form.campaignEndDate} />

                  <TextField
                    label="Campaign Name"
                    name="campaignName"
                    value={form.campaignName}
                    onChange={handleChange("campaignName")}
                    autoComplete="off"
                    requiredIndicator
                  />

                  <TextField
                    label="Campaign Description"
                    name="campaignDescription"
                    value={form.campaignDescription}
                    onChange={handleChange("campaignDescription")}
                    autoComplete="off"
                    multiline={3}
                  />

                  <Select
                    name="status"
                    label="Campaign Status"
                    options={statusOptions}
                    value={form.status}
                    onChange={handleChange("status")}
                    helpText="Current lifecycle state"
                  />

                  <FormLayout.Group>
                    <TextField
                      label="Code Prefix"
                      name="codePrefix"
                      value={form.codePrefix}
                      onChange={handleChange("codePrefix")}
                      autoComplete="off"
                      helpText="Optional prefix for discount codes generated in this campaign"
                    />
                    <TextField
                      label="Budget ($)"
                      name="budget"
                      type="number"
                      value={String(form.budget)}
                      onChange={(val) => handleChange("budget")(Number(val))}
                      autoComplete="off"
                      inputMode="decimal"
                      helpText={`Formatted: ${formatUSD(form.budget)}`}
                    />
                  </FormLayout.Group>

                  <FormLayout.Group>
                    <DateTimeField
                      label="Start Date & Time"
                      name="campaignStartDate"
                      value={form.campaignStartDate}
                      onChange={handleDateChange("campaignStartDate")}
                    />
                    <DateTimeField
                      label="End Date & Time"
                      name="campaignEndDate"
                      value={form.campaignEndDate}
                      onChange={handleDateChange("campaignEndDate")}
                    />
                  </FormLayout.Group>

                  <InlineStack align="start" gap="400">
                    <Button submit variant="primary" loading={isSubmitting}>
                      {submitText}
                    </Button>
                    <Button url={backTo}>Cancel</Button>
                  </InlineStack>
                </FormLayout>
              </RemixForm>
            </Card>

            {/* Campaign Goals */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Campaign Goals (Optional)
                </Text>

                {form.campaignGoals.map((goal, index) => (
                  <InlineStack key={index} wrap gap="300" align="end">
                    <div style={{ minWidth: 200 }}>
                      <Select
                        name="goalType"
                        label="Type"
                        options={goalTypeOptions}
                        value={goal.type}
                        onChange={(v) => handleGoalChange(index, "type", v)}
                      />
                    </div>
                    <div style={{ minWidth: 200 }}>
                      <Select
                        name="goalMetric"
                        label="Metric"
                        options={goalMetricOptions}
                        value={goal.metric}
                        onChange={(v) => handleGoalChange(index, "metric", v)}
                      />
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <TextField
                        label="Value"
                        type="number"
                        value={goal.value}
                        onChange={(v) => handleGoalChange(index, "value", v)}
                        autoComplete="off"
                        inputMode="decimal"
                      />
                    </div>
                    <Button
                      icon={DeleteIcon}
                      tone="critical"
                      onClick={() => handleDeleteGoal(index)}
                      accessibilityLabel="Delete goal"
                    />
                  </InlineStack>
                ))}

                <div>
                  <Button icon={PlusIcon} onClick={handleAddGoal} variant="plain">
                    Add Goal
                  </Button>
                  {form.campaignGoals.length === 0 && (
                    <Text as="p" tone="subdued" variant="bodySm">
                      Add one or more goals to track campaign success.
                    </Text>
                  )}
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

/** Date + Time grouped control; writes ISO string via onChange */
function DateTimeField({
  label,
  name,
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

  // Initialize date/time from value prop when it changes (for edit mode)
  React.useEffect(() => {
    if (value) {
      setDateVal(value.slice(0, 10));
      setTimeVal(value.slice(11, 16));
    }
  }, [value]);

  return (
    <InlineStack gap="200">
      <TextField label={`${label} (Date)`} type="date" value={dateVal} onChange={setDateVal} autoComplete="off" />
      <TextField label={`${label} (Time)`} type="time" value={timeVal} onChange={setTimeVal} autoComplete="off" />
    </InlineStack>
  );
}


// app/routes/app.campaigns.$id.ts

/*
// app/routes/app.campaigns.$id.edit.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form as RemixForm, useSubmit, Link } from "@remix-run/react";
import { Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack,
    Select, Text, Modal, InlineGrid, Badge} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { getCampaignForEdit } from "../lib/queries/supabase/getShopCampaignForEdit";
import { upsertShopCampaign } from "../lib/queries/supabase/upsertShopCampaign";
import { deleteShopCampaign } from "../lib/queries/supabase/deleteShopCampaignCascade";
import type { Database } from "../../supabase/database.types";
import { formatDateTime } from "../utils/format";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";


type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];


type ProgramRow = 
Pick<Tables<"programs">,"id" | "programName" | "status" | "startDate" | "endDate">;
type CampaignRow = Tables<"campaigns">;
type EnumOption = { label: string; value: string };
type CampaignStatus = CampaignRow["status"];

type LoaderData = {
  campaign: CampaignRow;
  programs: ProgramRow[];
  campaignStatus: Enums<"campaignStatus">[]; // dynamic enum
  typeOptions: EnumOption[]; // goal type
  metricOptions: EnumOption[]; // goal metric
  campaignGoals: NonNullable<CampaignRow["campaignGoals"]>;
  session: {
    shopsID: number;
    shopDomain: string;
  };
};


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);
  const url = new URL(request.url);
  const shopSingleCampaignID = Number(params.id);
  const { campaign, programs } = await getCampaignForEdit(
    shopsID,
    shopSingleCampaignID
  );

  // Enums via library
  const { getEnumsServer } = await import("../lib/queries/supabase/getEnums.server");
  const enums = await getEnumsServer();
  const toOptions = (vals?: string[]): EnumOption[] =>
    (vals ?? []).map((v) => ({ label: v, value: v }));

  const campaignStatus = (enums.campaignStatus ??
    []) as Enums<"campaignStatus">[];
  const typeOptions = toOptions(enums.campaignGoalType);
  const metricOptions = toOptions(enums.campaignGoalMetric);

  return json<LoaderData>({
    campaign,
    programs,
    campaignStatus,
    typeOptions,
    metricOptions,
    campaignGoals: Array.isArray(campaign.campaignGoals)
      ? campaign.campaignGoals
      : [],
    session: {
      shopsID: shopsID,
      shopDomain: session.shop,
    },
  });

  const statusOptions = React.useMemo(
  () => (campaignStatus ?? []).map((s) => ({ label: s, value: s })),
  [campaignStatus]
);
};


export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);
  const campaignsID = Number(params.id);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  const statusRaw = form.get("status")?.toString() ?? "";
  const status = (statusRaw || null) as Enums<"campaignStatus"> | null;

  if (intent === "delete") {
    await deleteShopCampaign(shopsID, campaignsID);
    return redirect(`/app/campaigns?deleted=${campaignsID}`);
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
        type: string; metric: string; value: string | number;
      }>;
      return arr.map(g => ({ ...g, value: Number(g.value ?? 0) }));
    } catch {
      return [];
    }
  };


  // Build payload (camel in UI -> snake in library)
  const payload = {
    campaignsID: campaignsID,
    shopsID,
    campaignName: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? "",
    codePrefix: form.get("codePrefix")?.toString() ?? "",
    budget: parseNullableNumber(form.get("budget")),
    startDate: form.get("campaignStartDate")?.toString() || null,
    endDate: form.get("campaignEndDate")?.toString() || null,
    campaignGoals: parseGoals(form.get("campaignGoals")),
    isDefautl: false,
    modifiedDate: new Date().toISOString(),
    status,
  } as const;

  await upsertShopCampaign(payload);

  return redirect(`/app/campaigns?updated=${campaignsID}`);
};

export default function EditCampaign() {
  const {
    campaign,
    programs,
    typeOptions,
    metricOptions,
    campaignGoals,
    campaignStatus,
  } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  const submit = useSubmit();

  // Normalize snake_case from DB into local UI state
  const [form, setForm] = React.useState({
    campaignName: campaign.campaignName ?? "",
    description: campaign.description ?? "",
    startDate: campaign.startDate ?? "",
    endDate: campaign.endDate ?? "",
    codePrefix: campaign.codePrefix ?? "",
    campaignStatus: campaign.status ?? "",
    budget:
      campaign.budget === null || campaign.budget === undefined
        ? ""
        : String(campaign.budget),
    campaignGoals: campaignGoals as Array<{
      type: string;
      metric: string;
      value: string | number;
    }>,
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
      campaignGoals: [
        ...prev.campaignGoals,
        { type: "", metric: "", value: "" },
      ],
    }));

  const handleGoalChange = (
    index: number,
    key: "type" | "metric" | "value",
    value: string
  ) => {
    const updated = [...form.campaignGoals];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, campaignGoals: updated }));
  };

  const handleDeleteGoal = (index: number) => {
    const updated = [...form.campaignGoals];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, campaignGoals: updated }));
  };

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    submit(fd, { method: "post" });
  };

  return (
    <Page
      title={`Edit Campaign: ${campaign.campaignName ?? ""}`}
      secondaryActions={[
        {
          content: "Delete campaign",
          onAction: () => setDeleteOpen(true),
          destructive: true,
          icon: DeleteIcon,
        },
      ]}
    >
      <Box paddingBlockEnd="300">
        <InlineStack gap="200" align="start">
          <Link to="/app/campaigns">
            <Button variant="plain">Back to campaigns</Button>
          </Link>
        </InlineStack>
      </Box>

      <InlineGrid columns={{ xs: 1, md: 2 }} gap="500" alignItems="start">
      
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
                  value={JSON.stringify(form.campaignGoals)}
                />

                <TextField
                  label="Campaign Name"
                  value={form.campaignName}
                  onChange={handleChange("campaignName")}
                  autoComplete="off"
                  requiredIndicator
                />
                <input
                  type="hidden"
                  name="campaignName"
                  value={form.campaignName}
                />

                <TextField
                  label="Campaign Description"
                  value={form.description}
                  onChange={handleChange("description")}
                  autoComplete="off"
                />
                <input
                  type="hidden"
                  name="description"
                  value={form.description}
                />

                <TextField
                  label="Code Prefix"
                  value={form.codePrefix}
                  onChange={handleChange("codePrefix")}
                  autoComplete="off"
                />
                <input
                  type="hidden"
                  name="codePrefix"
                  value={form.codePrefix}
                />

                  <Select
                    name="status"
                    label="Campaign Status"
                    options={statusOptions}
                    value={form.campaignStatus}
                    onChange={handleChange("campaignStatus")}
                    helpText="Initial lifecycle state"
                  />

                <TextField
                  label="Budget ($)"
                  type="number"
                  value={String(form.budget ?? "")}
                  onChange={handleChange("budget")}
                  autoComplete="off"
                  inputMode="decimal"
                />
                <input
                  type="hidden"
                  name="budget"
                  value={String(form.budget ?? "")}
                />

                <FormLayout.Group>
                  <DateTimeField
                    label="Start Date & Time"
                    value={form.startDate}
                    onChange={handleDateChange("startDate")}
                  />
                  <input
                    type="hidden"
                    name="startDate"
                    value={form.startDate}
                  />

                  <DateTimeField
                    label="End Date & Time"
                    value={form.endDate}
                    onChange={handleDateChange("endDate")}
                  />
                  <input
                    type="hidden"
                    name="endDate"
                    value={form.endDate}
                  />
                </FormLayout.Group>

                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Campaign Goals
                  </Text>
                  {form.campaignGoals.map((goal, index) => (
                    <InlineStack key={index} wrap gap="300">
                      <Select
                        label="Type"
                        options={typeOptions}
                        value={String(goal.type ?? "")}
                        onChange={(v) => handleGoalChange(index, "type", v)}
                      />
                      <Select
                        label="Metric"
                        options={metricOptions}
                        value={String(goal.metric ?? "")}
                        onChange={(v) => handleGoalChange(index, "metric", v)}
                      />
                      <TextField
                        label="Value"
                        type="number"
                        value={String(goal.value ?? "")}
                        onChange={(v) => handleGoalChange(index, "value", v)}
                        autoComplete="off"
                        inputMode="decimal"
                      />
                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        onClick={() => handleDeleteGoal(index)}
                      />
                    </InlineStack>
                  ))}
                  <Button icon={PlusIcon} onClick={handleAddGoal}>
                    Add a Goal
                  </Button>
                </BlockStack>

                <InlineStack gap="300" align="start">
                  <Button submit variant="primary" loading={isSubmitting}>
                    Save Changes
                  </Button>
                  <Button
                    tone="critical"
                    onClick={() => setDeleteOpen(true)}
                    icon={DeleteIcon}
                  >
                    Delete
                  </Button>
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

     
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Programs in this Campaign
              </Text>
              <Link to={`/app/campaigns/programs/?campaignId=${campaign.id}`}>
                <Button variant="primary" icon={PlusIcon}>
                  Create Program
                </Button>
              </Link>
            </InlineStack>

            {programs.length === 0 ? (
              <Text as="p" variant="bodyMd">
                No programs yet. Create your first program to get started.
              </Text>
            ) : (
              <BlockStack gap="200">
                {programs.map((p) => (
                  <Card key={p.id} padding="300">
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      wrap={false}
                    >
                      <BlockStack gap="050">
                        <Text as="h3" variant="headingSm">
                          {p.programName || `Program #${p.id}`}
                        </Text>
                        <Text as="p" variant="bodySm">
                          {formatRange(p.startDate ?? undefined, p.endDate ?? undefined)}
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={badgeToneForStatus(p.status ?? undefined)}>
                          {p.status}
                        </Badge>
                        <Link to={`/app/campaigns/programs/${p.id}`}>
                          <Button variant="secondary">Edit</Button>
                        </Link>
                      </InlineStack>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </InlineGrid>

    
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
        secondaryActions={[{ content: "Cancel", onAction: () => setDeleteOpen(false) }]}
      >
        <Modal.Section>
          <Text as="p">
            This will permanently delete this campaign and all associated programs.
            This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
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
  const [dateVal, setDateVal] = React.useState(value?.slice(0, 10) || "");
  const [timeVal, setTimeVal] = React.useState(value?.slice(11, 16) || "12:00");

  React.useEffect(() => {
    if (dateVal && timeVal) {
      const iso = new Date(`${dateVal}T${timeVal}:00`).toISOString();
      onChange(iso);
    } else {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateVal, timeVal]);

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