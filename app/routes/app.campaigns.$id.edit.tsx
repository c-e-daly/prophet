// app/routes/app.campaigns.$id.edit.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form as RemixForm, useSubmit } from "@remix-run/react";
import { Page, Card, Box, BlockStack, FormLayout, TextField, Button, InlineStack, Select, Text, Modal } from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "../utils/shopify/shopify.server";
import { Link } from "@remix-run/react";


type EnumOption = { label: string; value: string };

type LoaderData = {
  shop: string;
  campaignId: number;
  // Prefill fields
  campaignName: string;
  campaignDescription: string;
  codePrefix: string;
  budget: string; // dollars in the UI
  campaignStartDate: string; // ISO
  campaignEndDate: string; // ISO
  // Optional goals editor (matches your create page)
  typeOptions: EnumOption[];
  metricOptions: EnumOption[];
  campaignGoals: Array<{ type: string; metric: string; value: string }>;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const campaignId = Number(params.id);
  if (!Number.isFinite(campaignId)) {
    throw new Response("Invalid campaign id", { status: 400 });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Resolve internal shop.id from shopDomain
  const { data: shopRow, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("shopDomain", session.shop)
    .single();

  if (shopErr || !shopRow) throw new Response("Shop not found", { status: 404 });

  // Fetch the campaign for this shop
  const { data: camp, error: campErr } = await supabase
    .from("campaigns")
    .select(
      "id,name,description,code_prefix,budget_cents,start_date,end_date,goals" // goals assumed jsonb
    )
    .eq("shop", shopRow.id)
    .eq("id", campaignId)
    .single();

  if (campErr || !camp) throw new Response("Campaign not found", { status: 404 });

  // Map DB → UI
  const campaignGoals =
    (Array.isArray(camp.goals) ? camp.goals : [])?.map((g: any) => ({
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

  return json<LoaderData>({
    shop: session.shop,
    campaignId: camp.id,
    campaignName: camp.name ?? "",
    campaignDescription: camp.description ?? "",
    codePrefix: camp.code_prefix ?? "",
    budget: typeof camp.budget_cents === "number" ? (camp.budget_cents / 100).toString() : "",
    campaignStartDate: camp.start_date ?? "",
    campaignEndDate: camp.end_date ?? "",
    typeOptions,
    metricOptions,
    campaignGoals,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  const campaignId = Number(params.id);

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Resolve internal shop.id
  const { data: shopRow } = await supabase
    .from("shops")
    .select("id")
    .eq("shopDomain", session.shop)
    .single();
  if (!shopRow) return redirect(`/app/campaigns?shop=${encodeURIComponent(session.shop)}&error=shop_not_found`);

  // DELETE: remove children then campaign (or rely on FK cascade if you set it)
  if (intent === "delete") {
    await supabase.from("programs").delete().eq("shop", shopRow.id).eq("campaign", campaignId);
    await supabase.from("campaigns").delete().eq("shop", shopRow.id).eq("id", campaignId);
    return redirect(`/app/campaigns?shop=${encodeURIComponent(session.shop)}&deleted=${campaignId}`);
  }

  // SAVE / UPSERT (really an UPDATE by id+shop)
  const payload = {
    name: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? "",
    code_prefix: form.get("codePrefix")?.toString() ?? "",
    start_date: form.get("campaignStartDate")?.toString() ?? "",
    end_date: form.get("campaignEndDate")?.toString() ?? "",
    budget_cents: Math.round(Number(form.get("budget") ?? 0) * 100),
    goals: (() => {
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

  // Update by (shop,id)
  await supabase
    .from("campaigns")
    .update(payload)
    .eq("shop", shopRow.id)
    .eq("id", campaignId);

  return redirect(`/app/campaigns?shop=${encodeURIComponent(session.shop)}&updated=${campaignId}`);
}

export default function EditCampaign() {
  const {
    shop,
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
    budget,
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
      title={`Edit Campaign`}
      subtitle={`ID: ${campaignId}`}
      primaryAction={undefined}
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
          <Link to={`/app/campaigns?shop=${encodeURIComponent(shop)}`}>
            <Button variant="plain">Back to campaigns</Button>
          </Link>
        </InlineStack>
      </Box>
      <BlockStack gap="500">
        <Card>
          <RemixForm method="post" replace>
            <FormLayout>
              {/* Persist goals as JSON for the action */}
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
                value={form.budget}
                onChange={handleChange("budget")}
                autoComplete="off"
                inputMode="decimal"
              />
              <input type="hidden" name="budget" value={form.budget} />

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

              <BlockStack gap="300" />
              <InlineStack gap="300">
                <Button submit variant="primary" loading={isSubmitting}>
                  Save Changes
                </Button>
                <Button tone="critical" onClick={() => setDeleteOpen(true)} icon={DeleteIcon}>
                  Delete
                </Button>
              </InlineStack>
            </FormLayout>
          </RemixForm>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Campaign Goals
            </Text>

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
        </Card>
      </BlockStack>

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
            This will permanently delete this campaign and all associated programs for this shop. This action
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
