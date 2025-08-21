import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form as RemixForm } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack, Select, Text } from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../utils/shopify/shopify.server";
import { createCampaign } from "../lib/queries/createShopCampaign";

type EnumOption = { label: string; value: string };

type LoaderData = {
  shop: string;
  typeOptions: EnumOption[];
  metricOptions: EnumOption[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Use Shopify authentication instead of URL params
  const { admin, session } = await authenticate.admin(request);

  console.log("Campaigns create loader - authenticated:", session.shop);

  // TODO: replace with real Supabase lookups if desired
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
    typeOptions,
    metricOptions
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // Authenticate the action as well
  const { admin, session } = await authenticate.admin(request);

  const form = await request.formData();
  const payload = {
    campaignName: form.get("campaignName")?.toString() ?? "",
    campaignDescription: form.get("campaignDescription")?.toString() ?? "",
    campaignStartDate: form.get("campaignStartDate")?.toString() ?? "",
    campaignEndDate: form.get("campaignEndDate")?.toString() ?? "",
    codePrefix: form.get("codePrefix")?.toString() ?? "",
    budget: Number(form.get("budget") ?? 0),
    campaignGoals: (() => {
      try {
        const raw = form.get("campaignGoals")?.toString() ?? "[]";
        const arr = JSON.parse(raw) as Array<{ type: string; metric: string; value: string | number }>;
        return arr.map(g => ({ ...g, value: Number(g.value ?? 0) }));
      } catch {
        return [];
      }
    })(),
    externalId: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    active: true,
    shop: session.shop, // Use authenticated shop
  };

  console.log("Creating campaign for shop:", session.shop);

  await createCampaign(payload);
  return redirect(`/app/campaigns?shop=${encodeURIComponent(session.shop)}`);
}

export default function Campaigns() {
  const { shop, typeOptions, metricOptions } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";

  const [form, setForm] = React.useState({
    campaignName: "",
    campaignDescription: "",
    campaignStartDate: "",
    campaignEndDate: "",
    codePrefix: "",
    budget: "",
    campaignGoals: [] as Array<{ type: string; metric: string; value: string }>,
  });

  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "campaignStartDate" | "campaignEndDate") => (iso: string) =>
    setForm(prev => ({ ...prev, [field]: iso }));

  const handleAddGoal = () =>
    setForm(prev => ({
      ...prev,
      campaignGoals: [...prev.campaignGoals, { type: "", metric: "", value: "" }],
    }));

  const handleGoalChange = (index: number, key: "type" | "metric" | "value", value: string) => {
    const updated = [...form.campaignGoals];
    updated[index][key] = value;
    setForm(prev => ({ ...prev, campaignGoals: updated }));
  };

  const handleDeleteGoal = (index: number) => {
    const updated = [...form.campaignGoals];
    updated.splice(index, 1);
    setForm(prev => ({ ...prev, campaignGoals: updated }));
  };

  return (
    <Page title="Create New Campaign">
      <BlockStack gap="500">
        <Card>
          <RemixForm method="post" replace>
            <FormLayout>
              {/* Remove manual shop input - it's now handled by authentication */}
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
              <Button submit variant="primary" loading={isSubmitting}>
                Save Campaign
              </Button>
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