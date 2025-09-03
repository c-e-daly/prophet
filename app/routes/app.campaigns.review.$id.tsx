// app/routes/app.campaigns.$id.edit.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form as RemixForm, useSubmit, Link } from "@remix-run/react";
import { Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack, Select, Text,
  Modal, InlineGrid, Badge} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";
import { useShopContext } from "../lib/hooks/useShopContext";
import { getShopCampaignForEdit } from "../lib/queries/getShopSingleCampaign";

type EnumOption = { label: string; value: string };

// Minimal shape for Programs list on the right
type ProgramRow = {
  id: number;
  programName: string | null;
  status: string;        // enum in DB, render as Badge
  startDate: string;     // ISO
  endDate: string;       // ISO
};

type LoaderData = {
  campaignId: number;
  campaignName: string;
  campaignDescription: string;
  codePrefix: string;
  budget: number | null; // dollars in the UI
  campaignStartDate: string; // ISO
  campaignEndDate: string;   // ISO
  typeOptions: EnumOption[];
  metricOptions: EnumOption[];
  campaignGoals: Array<{ type: string; metric: string; value: string }>;
  programs: ProgramRow[];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Get complete shop session with cached shopsId
  const { shopSession } = await requireCompleteShopSession(request);
  
  const campaignId = Number(params.id);
  if (!Number.isFinite(campaignId)) {
    throw new Response("Invalid campaign id", { status: 400 });
  }

  // Use cached shopsId from session - no DB join needed!
  const campaign = await getShopCampaignForEdit(shopSession.shopsId, campaignId);

  const campaignGoals =
    (Array.isArray(campaign.campaignGoals) ? campaign.campaignGoals : [])?.map((g: any) => ({
      type: String(g?.type ?? ""),
      metric: String(g?.metric ?? ""),
      value: String(g?.value ?? ""),
    })) ?? [];

  const typeOptions: EnumOption[] = [
    { label: "Revenue", value: "revenue" },
    { label: "Orders", value: "orders" },
    { label: "AOV", value: "aov" },
    { label: "NOR", value: "nor" },
  ];
  const metricOptions: EnumOption[] = [
    { label: "Absolute", value: "absolute" },
    { label: "Percent", value: "percent" },
    { label: "Units", value: "units" },
  ];

  // Fetch programs using fast shopsId lookup with security check
  const { createClient } = await import("../utils/supabase/server");
  const supabase = createClient();
  
  const { data: programsRaw, error } = await supabase
    .from("programs")
    .select("id, programName, status, startDate, endDate")
    .eq("campaigns", campaignId)
    .eq("shops", shopSession.shopsId) // Security: ensure programs belong to this shop
    .order("startDate", { ascending: true });

  if (error) {
    console.error("Error fetching programs:", error);
  }

  const programs: ProgramRow[] =
    (programsRaw ?? []).map((p: any) => ({
      id: p.id,
      programName: p.programName ?? "",
      status: p.status ?? "DRAFT",
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
    })) ?? [];

  return json<LoaderData>({
    campaignId: campaign.id,
    campaignName: campaign.campaignName ?? "",
    campaignDescription: campaign.description ?? "",
    codePrefix: campaign.codePrefix ?? "",
    budget: campaign.budget !== null ? Number(campaign.budget) : null,
    campaignStartDate: campaign.startDate ?? "",
    campaignEndDate: campaign.endDate ?? "",
    typeOptions,
    metricOptions,
    campaignGoals,
    programs,
  });
}

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
  // Use session context inside component (not outside!)
  const { shopsId, shopsBrandName, shopDomain } = useShopContext();
  
  const {
    campaignId,
    typeOptions,
    metricOptions,
    campaignName,
    campaignDescription,
    codePrefix,
    budget,
    campaignStartDate,
    campaignEndDate,
    campaignGoals,
    programs,
  } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const submit = useSubmit();

  const [form, setForm] = React.useState({
    campaignName,
    campaignDescription,
    campaignStartDate,
    campaignEndDate,
    codePrefix,
    budget: budget ?? "",
    campaignGoals: campaignGoals as Array<{ type: string; metric: string; value: string }>,
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
      title={`Edit Campaign: ${campaignName}`}
      subtitle={`Shop: ${shopsBrandName}`}
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

      {/* TWO-COLUMN LAYOUT */}
      <InlineGrid
        columns={{ xs: 1, md: 2 }}   // 1 column on mobile, 2 on desktop
        gap="500"
        alignItems="start"
      >
        {/* LEFT: Single vertical Card with the entire form */}
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

                {/* Goals editor stays inside the left card to keep "single vertical card" spec.
                   If you prefer goals on right, move the whole block to the right column. */}
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

        {/* RIGHT: Programs list for this campaign */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Programs in this Campaign</Text>
              <Link to={`/app/campaigns/programs/create?campaignId=${campaignId}`}>
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
            This will permanently delete this campaign and all associated programs for {shopsBrandName}. This action
            cannot be undone.
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
      <TextField label={`${label} (Date)`} type="date" value={dateVal} onChange={setDateVal} autoComplete="off" />
      <TextField label={`${label} (Time)`} type="time" value={timeVal} onChange={setTimeVal} autoComplete="off" />
    </InlineStack>
  );
}

/** Helpers for Programs list */
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