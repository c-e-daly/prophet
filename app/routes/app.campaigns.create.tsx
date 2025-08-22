// app/routes/app.campaigns.create.tsx
import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Link, useSearchParams, Form as RemixForm } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack, Select,
  Text, Layout} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import { createCampaign } from "../lib/queries/createShopCampaign";
import { formatUSD } from "../utils/format";
import { CampaignGoalTypeValues, CampaignMetricValues, CampaignStatusValues,
  type CampaignStatus,
  type CampaignGoal,
  type CampaignGoalType,
  type CampaignMetric,
} from "../lib/queries/types";

type EnumOption = { label: string; value: string };

type LoaderData = {
  shopDomain: string;
  shopId: number;
  goalOptions: EnumOption[];
  metricOptions: EnumOption[];
  statusOptions: EnumOption[];
};

// ---------- Loader ----------
export const loader = withShopLoader(
  async ({
    shopDomain,
    shopId,
    request,
  }: {
    shopDomain: string;
    shopId: number;
    request: LoaderFunctionArgs["request"];
  }) => {
    const goalOptions = CampaignGoalTypeValues.map((g) => ({ label: g, value: g }));
    const metricOptions = CampaignMetricValues.map((m) => ({ label: m, value: m }));
    const statusOptions = CampaignStatusValues.map((s) => ({ label: s, value: s }));

    return json<LoaderData>({ shopDomain, shopId, goalOptions, metricOptions, statusOptions });
  }
);

// ---------- Action ----------
export const action = withShopAction(
  async ({ shopId, request }: { shopId: number; request: Request }) => {
    const form = await request.formData();

    const toStr = (v: FormDataEntryValue | null) => (v ? v.toString().trim() : "");
    const toNum = (v: FormDataEntryValue | null) => Number(v ?? 0);

    // Parse goals from hidden JSON input and coerce to typed CampaignGoal[]
    const parseGoals = (): CampaignGoal[] => {
      try {
        const raw = toStr(form.get("campaignGoals")) || "[]";
        const arr = JSON.parse(raw) as Array<{ type: string; metric: string; value: string | number }>;
        return arr.map((g) => ({
          goal: g.type as CampaignGoalType,
          metric: g.metric as CampaignMetric,
          value: Number(g.value ?? 0),
        }));
      } catch {
        return [];
      }
    };

    const status = (toStr(form.get("status")) || "Draft") as CampaignStatus;

    await createCampaign({
      shop: shopId,
      campaignName: toStr(form.get("campaignName")),
      description: toStr(form.get("campaignDescription")) || null,
      codePrefix: toStr(form.get("codePrefix")) || null,
      budget: toNum(form.get("budget")) || 0, // dollars
      startDate: toStr(form.get("campaignStartDate")) || null,
      endDate: toStr(form.get("campaignEndDate")) || null,
      campaignGoals: parseGoals(),
      status,
      isDefault: false
    });

    return redirect(`/app/campaigns`);
  }
);

// ---------- Component ----------
export default function CreateCampaignPage() {
  const { goalOptions, metricOptions, statusOptions } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const [sp] = useSearchParams();
  const backTo = sp.toString() ? `/app/campaigns?${sp.toString()}` : "/app/campaigns";

  // Keep UI state as strings so it's easy to type empty/defaults.
  type UIGoal = { type: string; metric: string; value: string };
  const [form, setForm] = React.useState({
    campaignName: "",
    campaignDescription: "",
    campaignStartDate: "",
    campaignEndDate: "",
    codePrefix: "",
    budget: 0,
    status: "Draft" as CampaignStatus,
    campaignGoals: [] as UIGoal[],
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
      campaignGoals: [
        ...prev.campaignGoals,
        { type: "", metric: "absolute", value: "" }, // sensible defaults
      ],
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

  return (
    <Page>
      <Layout>
        <InlineStack>
          <Link to="app/campaigns">
          <Text as="h1">← Return to Campaigns</Text>
          </Link>
        </InlineStack>
        <Layout.Section variant="oneHalf">
          <BlockStack gap="500">
            <Card>
              <RemixForm method="post" replace>
                <FormLayout>
                  {/* Hidden inputs for non-native Polaris fields */}
                  <input type="hidden" name="campaignGoals" value={JSON.stringify(form.campaignGoals)} />
                  <input type="hidden" name="campaignStartDate" value={form.campaignStartDate} />
                  <input type="hidden" name="campaignEndDate" value={form.campaignEndDate} />
                  <input type="hidden" name="status" value={form.status} />

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

                  <FormLayout.Group>
                    <TextField
                      label="Code Prefix"
                      name="codePrefix"
                      value={form.codePrefix}
                      onChange={handleChange("codePrefix")}
                      autoComplete="off"
                      helpText="Optional prefix for discount codes generated in this campaign"
                    />

                    <Select
                      label="Status"
                      // Polaris Select doesn't submit; we mirror via hidden input above.
                      options={statusOptions}
                      value={form.status}
                      onChange={handleChange("status")}
                    />
                  </FormLayout.Group>

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
                      Create Campaign
                    </Button>
                    <Button url="/app/campaigns">Cancel</Button>
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
                    <div style={{ minWidth: 180 }}>
                      <Select
                        label="Type"
                        options={goalOptions}
                        value={goal.type}
                        onChange={(v) => handleGoalChange(index, "type", v)}
                      />
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <Select
                        label="Metric"
                        options={metricOptions}
                        value={goal.metric}
                        onChange={(v) => handleGoalChange(index, "metric", v)}
                      />
                    </div>
                    <div style={{ minWidth: 140 }}>
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
