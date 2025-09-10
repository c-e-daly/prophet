// app/routes/app.campaigns.$id.edit.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form as RemixForm, useSubmit, Link } from "@remix-run/react";
import {
  Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, Modal, InlineGrid, Badge
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { getCampaignForEdit } from "../lib/queries/supabase/getShopCampaignForEdit";
import { updateShopCampaignById } from "../lib/queries/supabase/updateShopCampaign";
import { deleteShopCampaignById } from "../lib/queries/supabase/deleteShopCampaignCascade";
import { getShopSession } from "../lib/session/shopSession.server";
import type { Database } from "../../supabase/database.types";
import { formatDateTime } from "../utils/format";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

type ProgramRow = Pick<
  Tables<"programs">,
  "id" | "programName" | "status" | "startDate" | "endDate"
>;
type CampaignRow = Tables<"campaigns">;
type EnumOption = { label: string; value: string };

type LoaderData = {
  campaign: CampaignRow;
  programs: ProgramRow[];
  campaignStatus: Enums<"campaignStatus">[]; // dynamic enum
  typeOptions: EnumOption[]; // goal type
  metricOptions: EnumOption[]; // goal metric
  campaignGoals: NonNullable<CampaignRow["campaignGoals"]>;
  shopSession: {
    shopsID: number;
    shopDomain: string;
    shopBrandName: string;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await getShopSession(request);
  if (!session?.shopsID) {
    throw redirect("/auth");
  }

  const campaignId = Number(params.id);
  if (!Number.isFinite(campaignId)) {
    throw new Response("Invalid campaign id", { status: 400 });
  }

  const { campaign, programs } = await getCampaignForEdit(
    session.shopsID,
    campaignId
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
    shopSession: {
      shopsID: session.shopsID,
      shopDomain: session.shopDomain,
      shopBrandName: session.shopsBrandName,
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const session = await getShopSession(request);
  if (!session?.shopsID) {
    throw redirect("/auth");
  }
  const campaignId = Number(params.id);
  if (!Number.isFinite(campaignId)) {
    throw new Response("Invalid campaign id", { status: 400 });
  }

  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  if (intent === "delete") {
    // Library handles multi-tenant safe cascade delete
    await deleteShopCampaignById(session.shopsID, campaignId);
    return redirect(`/app/campaigns?deleted=${campaignId}`);
  }

  // Build payload (camel in UI -> snake in library)
  const payload = {
    id: campaignId,
    shopsID: session.shopsID,
    campaignName: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? "",
    codePrefix: form.get("codePrefix")?.toString() ?? "",
    budget: (() => {
      const raw = form.get("budget");
      if (raw == null || raw.toString().trim() === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    })(),
    startDate: form.get("campaignStartDate")?.toString() || null,
    endDate: form.get("campaignEndDate")?.toString() || null,
    campaignGoals: (() => {
      try {
        const raw = form.get("campaignGoals")?.toString() ?? "[]";
        const arr = JSON.parse(raw) as Array<{
          type: string;
          metric: string;
          value: string | number;
        }>;
        return arr.map((g) => ({ ...g, value: Number(g.value ?? 0) }));
      } catch {
        return [];
      }
    })(),
    active: true,
  } as const;

  await updateShopCampaignById(payload);

  return redirect(`/app/campaigns?updated=${campaignId}`);
};

export default function EditCampaign() {
  const {
    campaign,
    programs,
    typeOptions,
    metricOptions,
    campaignGoals,
    shopSession,
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
      subtitle={`Shop: ${shopSession.shopBrandName}`}
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
        {/* LEFT: Full edit form */}
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

        {/* RIGHT: Programs list */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Programs in this Campaign
              </Text>
              <Link to={`/app/campaigns/programs/create?campaignId=${campaign.id}`}>
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
                        <Link to={`/app/campaigns/programs/${p.id}/edit`}>
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

      {/* Delete confirmation */}
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
            This will permanently delete this campaign and all associated programs
            for {shopSession.shopBrandName}. This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

/** Date + Time grouped control; writes ISO string via onChange */
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

/** Helpers for Programs list */
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


/*
// app/routes/app.campaigns.$id.edit.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs, SerializeFrom } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form as RemixForm, useSubmit, Link } from "@remix-run/react";
import { Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack, Select, Text,
  Modal, InlineGrid, Badge} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";
import { getShopCampaignForEdit } from "../lib/queries/getShopSingleCampaign";
import type { Database } from "../../supabase/database.types";
import { getCampaignForEdit } from "../lib/queries/getShopCampaignForEdit";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

type ProgramRow = Pick<Tables<"programs">, "id" | "programName" | "status" | "startDate" | "endDate">;
type CampaignRow = Tables<"campaigns">;
type EnumOption = { label: string; value: string };

type LoaderData = {
  campaign: CampaignRow;
  programs: ProgramRow[];
  campaignStatus: Enums<"campaignStatus">[];      
  campaignGoals: NonNullable<CampaignRow["campaignGoals"]>;
  typeOptions: EnumOption[];                     
  metricOptions: EnumOption[];                   
  shopSession: {
    shopsId: number;
    shopDomain: string;
    shopBrandName: string;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopSession } = await requireCompleteShopSession(request);
  const campaign_id = Number(params.id);
  if (!Number.isFinite(campaign_id)) {
    throw new Response("Invalid campaign id", { status: 400 });
  }

   const {campaign, programs} = await getShopCampaignForEdit(shopSession.shopsId, campaign_id);

  // Enum options (dynamic, from server)
  const { getEnumsServer } = await import("../lib/queries/getEnums.server");
  const enums = await getEnumsServer();
  const toOptions = (vals?: string[]): EnumOption[] =>
    (vals ?? []).map(v => ({ label: v, value: v }));

  const campaignStatus = (enums.campaignStatus ?? []) as Enums<"campaignStatus">[];
  const typeOptions   = toOptions(enums.campaignGoalType);    // e.g. ["Revenue","Orders","AOV","NOR"]
  const metricOptions = toOptions(enums.campaignGoalMetric);  // e.g. ["Absolute","Percent","Units"]

  return json<LoaderData>({
    campaign,
    programs,
    campaignStatus,
    typeOptions,
    metricOptions,
    campaignGoals: Array.isArray(campaign.campaign_goals) ? campaign.campaign_goals : [],
    shopSession: {
      shopsId: shopSession.shopsId,
      shopDomain: shopSession.shopDomain,
      shopBrandName: shopSession.shopsBrandName,
    },
  });

};

export async function action({ request, params }: ActionFunctionArgs) {
  // Get complete shop session for actions
  const { shopSession } = await requireCompleteShopSession(request);
  
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  const campaignId = Number(params.id);

  const { createClient } = await import("../utils/supabase/server");
  const supabase = createClient();

  if (intent === "delete") {
    // Use shopsId for fast, secure deletion
    await supabase
      .from("programs")
      .delete()
      .eq("campaigns", campaignId)
      .eq("shops", shopSession.shopsId); // Security check
      
    await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("shops", shopSession.shopsId); // Security check
      
    return redirect(`/app/campaigns?deleted=${campaignId}`);
  }

  // Update campaign payload
  const payload = {
    campaignName: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? "",
    codePrefix: form.get("codePrefix")?.toString() ?? "",
    startDate: form.get("campaignStartDate")?.toString() ?? "",
    endDate: form.get("campaignEndDate")?.toString() ?? "",
    budget: (() => {
      const raw = form.get("budget");
      if (raw == null || raw.toString().trim() === "") return null;
      return Number(raw);
    })(),
    campaignGoals: (() => {
      try {
        const raw = form.get("campaignGoals")?.toString() ?? "[]";
        const arr = JSON.parse(raw) as Array<{ type: string; metric: string; value: string | number }>;
        return arr.map((g) => ({ ...g, value: Number(g.value ?? 0) }));
      } catch {
        return [];
      }
    })(),
    modified_date: new Date().toISOString(),
  };

  // Update using shopsId for security and performance
  await supabase
    .from("campaigns")
    .update(payload)
    .eq("id", campaignId)
    .eq("shops", shopSession.shopsId);
    
  return redirect(`/app/campaigns?updated=${campaignId}`);
}

export default function EditCampaign() {
  const {
    campaign,
    programs,
    typeOptions,
    metricOptions,
    campaignGoals,
    shopSession,
  } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const submit = useSubmit();

  // initialize form from `campaign` instead of individual fields
  const [form, setForm] = React.useState({
    campaignName: campaign.campaignName ?? "",
    campaignDescription: campaign.description ?? "",
    campaignStartDate: campaign.startDate ?? "",
    campaignEndDate: campaign.endDate ?? "",
    codePrefix: campaign.codePrefix ?? "",
    budget: campaign.budget ?? "",
    campaignGoals: (campaignGoals as Array<{ type: string; metric: string; value: string }>),
  });

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "campaignStartDate" | "campaignEndDate") => (iso: string) =>
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

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    submit(fd, { method: "post" });
  };

  return (
    <Page
      title={`Edit Campaign: ${campaign.campaignName}`}
      subtitle={`Shop: ${shopSession.shopBrandName}`}
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

 
      <InlineGrid
        columns={{ xs: 1, md: 2 }}   // 1 column on mobile, 2 on desktop
        gap="500"
        alignItems="start"
      >
        
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Campaign Details</Text>
            <RemixForm method="post" replace>
              <FormLayout>
                <input type="hidden" name="campaignGoals" value={JSON.stringify(form.campaignGoals)} />

                <TextField
                  label="Campaign Name"
                  value={form.campaignName}
                  onChange={handleChange("campaignName")}
                  autoComplete="off"
                  requiredIndicator
                />
                <input type="hidden" name="campaignName" value={form.campaignName} />

                <TextField
                  label="Campaign Description"
                  value={form.campaignDescription}
                  onChange={handleChange("campaignDescription")}
                  autoComplete="off"
                />
                <input type="hidden" name="campaignDescription" value={form.campaignDescription} />

                <TextField
                  label="Code Prefix"
                  value={form.codePrefix}
                  onChange={handleChange("codePrefix")}
                  autoComplete="off"
                />
                <input type="hidden" name="codePrefix" value={form.codePrefix} />

                <TextField
                  label="Budget ($)"
                  type="number"
                  value={form.budget.toString()}
                  onChange={handleChange("budget")}
                  autoComplete="off"
                />
                <input type="hidden" name="budget" value={form.budget.toString()} />

                <FormLayout.Group>
                  <DateTimeField
                    label="Start Date & Time"
                    value={form.campaignStartDate}
                    onChange={handleDateChange("campaignStartDate")}
                  />
                  <input type="hidden" name="campaignStartDate" value={form.campaignStartDate} />

                  <DateTimeField
                    label="End Date & Time"
                    value={form.campaignEndDate}
                    onChange={handleDateChange("campaignEndDate")}
                  />
                  <input type="hidden" name="campaignEndDate" value={form.campaignEndDate} />
                </FormLayout.Group>

                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">Campaign Goals</Text>
                  {form.campaignGoals.map((goal, index) => (
                    <InlineStack key={index} wrap gap="300">
                      <Select
                        label="Type"
                        options={typeOptions}
                        value={goal.type}
                        onChange={(v) => handleGoalChange(index, "type", v)}
                      />
                      <Select
                        label="Metric"
                        options={metricOptions}
                        value={goal.metric}
                        onChange={(v) => handleGoalChange(index, "metric", v)}
                      />
                      <TextField
                        label="Value"
                        type="number"
                        value={goal.value}
                        onChange={(v) => handleGoalChange(index, "value", v)}
                        autoComplete="off"
                        inputMode="decimal"
                      />
                      <Button icon={DeleteIcon} tone="critical" onClick={() => handleDeleteGoal(index)} />
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
                  <Button tone="critical" onClick={() => setDeleteOpen(true)} icon={DeleteIcon}>
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
              <Text as="h2" variant="headingMd">Programs in this Campaign</Text>
              <Link to={`/app/campaigns/programs/create?campaignId=${campaign.id}`}>
                <Button variant="primary" icon={PlusIcon}>Create Program</Button>
              </Link>
            </InlineStack>

            {programs.length === 0 ? (
              <Text as="p" variant="bodyMd">No programs yet. Create your first program to get started.</Text>
            ) : (
              <BlockStack gap="200">
                {programs.map((p) => (
                  <Card key={p.id} padding="300">
                    <InlineStack align="space-between" blockAlign="center" wrap={false}>
                      <BlockStack gap="050">
                        <Text as="h3" variant="headingSm">{p.programName || `Program #${p.id}`}</Text>
                        <Text as="p" variant="bodySm">
                          {formatRange(p.startDate, p.endDate)}
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={badgeToneForStatus(p.status)}>{p.status}</Badge>
                        <Link to={`/app/campaigns/programs/${p.id}/edit`}>
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
            This will permanently delete this campaign and all associated programs for {shopSession.shopBrandName}. This action
            cannot be undone.
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
      <TextField label={`${label} (Date)`} type="date" value={dateVal} onChange={setDateVal} autoComplete="off" />
      <TextField label={`${label} (Time)`} type="time" value={timeVal} onChange={setTimeVal} autoComplete="off" />
    </InlineStack>
  );
}


function formatRange(startISO?: string, endISO?: string) {
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");
  const s = fmt(startISO);
  const e = fmt(endISO);
  if (s && e) return `${s} — ${e}`;
  if (s) return s;
  if (e) return e;
  return "No dates set";
}

function badgeToneForStatus(status?: string): "success" | "warning" | "critical" | "attention" | "info" | undefined {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "PAUSED") return "warning";
  if (s === "ARCHIVED") return "critical";
  if (s === "DRAFT") return "info";
  return undefined;
}

*/