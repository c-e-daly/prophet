// app/routes/app.campaigns.programs.create.tsx
import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, useActionData } from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, Select, Checkbox, InlineStack, Banner, BlockStack } from "@shopify/polaris";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import { createClient } from "../utils/supabase/server";
import { createShopProgram } from "../lib/queries/createShopProgram";
import type { Tables } from "../lib/queries/types/dbTables";

type Campaign = Tables<"campaigns">;
type Program = Tables<"programs">;

type LoaderData = {
  shopDomain: string;
  shopId: number;
  campaigns: Array<{ id: number; campaignName: string }>;
  statusOptions: { label: string; value: Program["status"] }[];
  focusOptions: { label: string; value: string }[];
};

type ActionData = {
  error?: string;
};

// ---------- LOADER ----------
export const loader = withShopLoader(async ({ shopId, shopDomain, request }) => {
  const supabase = createClient();
  
  // Fetch non-archived campaigns for this shop
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, campaignName")
    .eq("shop", shopId)
    .neq("status", "Archived")
    .order("campaignName");

  if (error) throw new Response(error.message, { status: 500 });

  const statusOptions: LoaderData["statusOptions"] = [
    { label: "Draft", value: "Draft" },
    { label: "Pending", value: "Pending"},
    { label: "Active", value: "Active" },
    { label: "Paused", value: "Paused" },
    { label: "Archived", value: "Archived" },
  ];

  const focusOptions: LoaderData["focusOptions"] = [
    { label: "Acquistion", value: "Acquisition" },
    { label: "Growth", value: "Growth" },
    { label: "Reactivation", value: "Reactivation" },
    { label: "Reverse Declining", value: "Reverse Declining" },
    { label: "Inventory Clearance", value: "Inventory Clearance" },
  ];

  return json<LoaderData>({
    shopDomain,
    shopId,
    campaigns: campaigns || [],
    statusOptions,
    focusOptions,
  });
});

// ---------- ACTION ----------
export const action = withShopAction(async ({ shopId, request }) => {
  const form = await request.formData();

  const toStr = (v: FormDataEntryValue | null) => (v ? v.toString().trim() : "");
  const toNum = (v: FormDataEntryValue | null) => Number(v ?? 0);
  const toBool = (v: FormDataEntryValue | null) => v === "true";

  const campaignId = toNum(form.get("campaignId"));
  if (!campaignId) {
    return json<ActionData>({ error: "Please select a campaign" }, { status: 400 });
  }

  // Verify the campaign belongs to this shop
  const supabase = createClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("shop", shopId)
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    return json<ActionData>({ error: campaignError.message }, { status: 500 });
  }
  if (!campaign) {
    return json<ActionData>({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    await createShopProgram({
    shop: shopId,
      campaignId,
      programName: toStr(form.get("programName")),
      startDate: toStr(form.get("startDate")) || null,
      endDate: toStr(form.get("endDate")) || null,
      programFocus: (toStr(form.get("programFocus")) || null) as Program["programFocus"],
      codePrefix: toStr(form.get("codePrefix")) || null,
      acceptRate: toNum(form.get("acceptRate")) || null,
      declineRate: toNum(form.get("declineRate")) || null,
      expiryTimeMinutes: toNum(form.get("expiryTimeMinutes")) || null,
      combineWithOrderDiscounts: toBool(form.get("combineWithOrderDiscounts")),
      combineWithProductDiscounts: toBool(form.get("combineWithProductDiscounts")),
      combineWithShippingDiscounts: toBool(form.get("combineWithShippingDiscounts")),
      status: toStr(form.get("status")) as Program["status"] || "Draft",
    });

    return redirect("/app/campaigns/programs");
  } catch (error) {
    return json<ActionData>(
      { error: error instanceof Error ? error.message : "Failed to create program" },
      { status: 400 }
    );
  }
});

// ---------- COMPONENT ----------
export default function ProgramCreate() {
  const { campaigns, statusOptions, focusOptions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";

  // Form state
  const [form, setForm] = React.useState({
    campaignId: "",
    programName: "",
    startDate: "",
    endDate: "",
    programFocus: "",
    codePrefix: "",
    acceptRate: "",
    declineRate: "",
    expiryTimeMinutes: "",
    combineWithOrderDiscounts: false,
    combineWithProductDiscounts: false,
    combineWithShippingDiscounts: false,
    status: "Draft" as Program["status"],
  });

  const handleChange = (field: keyof typeof form) => (value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateTimeChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  const campaignOptions = [
    { label: "Select a campaign", value: "" },
    ...campaigns.map((c: Campaign) => ({ label: c.campaignName, value: String(c.id) })),
  ];

  return (
    <Page 
      title="Create Program"
      backAction={{ url: "/app/campaigns/programs" }}
    >
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>Error creating program: {actionData.error}</p>
          </Banner>
        )}

        <Card>
          <RemixForm method="post" replace>
            {/* Hidden inputs for non-native Polaris fields */}
            <input type="hidden" name="startDate" value={form.startDate} />
            <input type="hidden" name="endDate" value={form.endDate} />
            <input type="hidden" name="status" value={form.status} />
            <input type="hidden" name="combineWithOrderDiscounts" value={String(form.combineWithOrderDiscounts)} />
            <input type="hidden" name="combineWithProductDiscounts" value={String(form.combineWithProductDiscounts)} />
            <input type="hidden" name="combineWithShippingDiscounts" value={String(form.combineWithShippingDiscounts)} />

            <FormLayout>
              <Select
                label="Campaign"
                name="campaignId"
                options={campaignOptions}
                value={form.campaignId}
                onChange={handleChange("campaignId")}
                requiredIndicator
              />

              <TextField
                label="Program Name"
                name="programName"
                value={form.programName}
                onChange={handleChange("programName")}
                autoComplete="off"
                requiredIndicator
              />

              <FormLayout.Group>
                <DateTimeField
                  label="Start Date & Time"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleDateTimeChange("startDate")}
                />
                <DateTimeField
                  label="End Date & Time"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleDateTimeChange("endDate")}
                />
              </FormLayout.Group>

              <Select
                label="Program Focus"
                name="programFocus"
                options={[{ label: "Select focus", value: "" }, ...focusOptions]}
                value={form.programFocus}
                onChange={handleChange("programFocus")}
              />

              <TextField
                label="Code Prefix"
                name="codePrefix"
                value={form.codePrefix}
                onChange={handleChange("codePrefix")}
                autoComplete="off"
                helpText="Optional prefix for discount codes generated in this program"
              />

              <FormLayout.Group>
                <TextField
                  label="Accept Rate (%)"
                  name="acceptRate"
                  type="number"
                  value={form.acceptRate}
                  onChange={handleChange("acceptRate")}
                  autoComplete="off"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  helpText="Percentage of requests to accept"
                />
                <TextField
                  label="Decline Rate (%)"
                  name="declineRate"
                  type="number"
                  value={form.declineRate}
                  onChange={handleChange("declineRate")}
                  autoComplete="off"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  helpText="Percentage of requests to decline"
                />
              </FormLayout.Group>

              <TextField
                label="Expiry Time (Minutes)"
                name="expiryTimeMinutes"
                type="number"
                value={form.expiryTimeMinutes}
                onChange={handleChange("expiryTimeMinutes")}
                autoComplete="off"
                inputMode="numeric"
                min="1"
                helpText="How long offers remain valid"
              />

              <Select
                label="Status"
                options={statusOptions}
                value={form.status}
                onChange={handleChange("status")}
              />

              <BlockStack gap="300">
                <Checkbox
                  label="Combine with order discounts"
                  checked={form.combineWithOrderDiscounts}
                  onChange={handleChange("combineWithOrderDiscounts")}
                />
                <Checkbox
                  label="Combine with product discounts"
                  checked={form.combineWithProductDiscounts}
                  onChange={handleChange("combineWithProductDiscounts")}
                />
                <Checkbox
                  label="Combine with shipping discounts"
                  checked={form.combineWithShippingDiscounts}
                  onChange={handleChange("combineWithShippingDiscounts")}
                />
              </BlockStack>

              <InlineStack align="start" gap="400">
                <Button submit variant="primary" loading={isSubmitting}>
                  Create Program
                </Button>
                <Button url="/app/campaigns/programs">Cancel</Button>
              </InlineStack>
            </FormLayout>
          </RemixForm>
        </Card>
      </BlockStack>
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