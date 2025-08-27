import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, useActionData } from "@remix-run/react";
import React from "react";
import { Page, Card, FormLayout, TextField, Button, Select, InlineStack, InlineGrid, Banner, BlockStack, Text} from "@shopify/polaris";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import { createClient } from "../utils/supabase/server";
import { createShopProgram } from "../lib/queries/createShopProgram";
import type { Tables } from "../lib/queries/types/dbTables";

type Campaign = Tables<"campaigns">;
type Program = Tables<"programs">;

const PROGRAM_FOCUS_OPTIONS = [
  { label: "Select focus", value: "" },
  { label: "Acquisition", value: "Acquisition" },
  { label: "Growth", value: "Growth" },
  { label: "Reactivation", value: "Reactivation" },
  { label: "Reverse Declining", value: "Reverse Declining" },
  { label: "Inventory Clearance", value: "Inventory Clearance" },
];

const STATUS_OPTIONS = [
  { label: "Draft", value: "Draft" },
  { label: "Pending", value: "Pending" },
  { label: "Active", value: "Active" },
  { label: "Paused", value: "Paused" },
  { label: "Archived", value: "Archived" },
];

const YES_NO_OPTIONS = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];

// ---------- LOADER ----------
export const loader = withShopLoader(async ({ shopId, shopDomain }) => {
  const supabase = createClient();
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, campaignName")
    .eq("shop", shopId)
    .neq("status", "Archived")
    .order("campaignName");

  if (error) throw new Response(error.message, { status: 500 });

  return json({ shopDomain, shopId, campaigns: campaigns || [] });
});

// ---------- ACTION ----------
export const action = withShopAction(async ({ shopId, request }) => {
  const form = await request.formData();

  const campaignId = Number(form.get("campaignId"));
  if (!campaignId) return json({ error: "Please select a campaign" }, { status: 400 });

  const supabase = createClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("shop", shopId)
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) return json({ error: campaignError.message }, { status: 500 });
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

  // Helper coercers
  const toNumOrNull = (v: FormDataEntryValue | null) =>
    v === null || v === "" ? null : Number(v);
  const toBool = (v: FormDataEntryValue | null) => v?.toString() === "true";

  try {
    await createShopProgram({
      shop: shopId,
      campaignId,
      programName: form.get("programName")?.toString().trim() || "",
      startDate: form.get("startDate")?.toString() || null,
      endDate: form.get("endDate")?.toString() || null,
      programFocus: form.get("programFocus")?.toString() || undefined,
      codePrefix: form.get("codePrefix")?.toString().trim() || null,
      acceptRate: toNumOrNull(form.get("acceptRate")),
      declineRate: toNumOrNull(form.get("declineRate")),
      expiryTimeMinutes: toNumOrNull(form.get("expiryTimeMinutes")),
      combineWithOrderDiscounts: toBool(form.get("combineWithOrderDiscounts")),
      combineWithProductDiscounts: toBool(form.get("combineWithProductDiscounts")),
      combineWithShippingDiscounts: toBool(form.get("combineWithShippingDiscounts")),
      status: (form.get("status")?.toString() || "Draft") as Program["status"],
    });

    // Route back to campaigns index
    return redirect("/app/campaigns");
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to create program" },
      { status: 400 }
    );
  }
});

// ---------- COMPONENT ----------
export default function ProgramCreate() {
  const { campaigns } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const campaignOptions = [
    { label: "Select a campaign", value: "" },
    ...campaigns.map((c: Campaign) => ({ label: c.campaignName, value: String(c.id) })),
  ];

  // Controlled state for Yes/No selects (default to "false")
  const [combineOrder, setCombineOrder] = React.useState("false");
  const [combineProduct, setCombineProduct] = React.useState("false");
  const [combineShipping, setCombineShipping] = React.useState("false");

  return (
    <Page title="Create Program" backAction={{ url: "/app/campaigns" }}>
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>Error creating program: {actionData.error}</p>
          </Banner>
        )}

        <Card>
          <RemixForm method="post">
            <FormLayout>
              {/* Campaign */}
              <Select
                label="Campaign"
                name="campaignId"
                options={campaignOptions}
                requiredIndicator
              />

              {/* Program Name */}
              <TextField
                label="Program Name"
                name="programName"
                autoComplete="off"
                requiredIndicator
              />

              {/* Status under Program Name */}
              <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue="Draft" />

              {/* Dates */}
              <FormLayout.Group>
                <TextField label="Start Date" name="startDate" type="datetime-local" autoComplete="off" />
                <TextField label="End Date" name="endDate" type="datetime-local" autoComplete="off" />
              </FormLayout.Group>

              {/* Program Focus + Code Prefix */}
              <FormLayout.Group>
                <Select label="Program Focus" name="programFocus" options={PROGRAM_FOCUS_OPTIONS} />
                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  autoComplete="off"
                  helpText="Optional prefix for discount codes"
                />
              </FormLayout.Group>

              {/* Accept / Decline / Expiry */}
              <FormLayout.Group>
                <Text as="h3" variant="headingSm">Offer Evaluation Settings</Text>
                <Text as="p">Select your program offer rates and time for offers to expire.</Text>
                <TextField label="Accept Rate (%)" name="acceptRate" type="number" min="0" max="100" autoComplete="off" />
                <TextField label="Decline Rate (%)" name="declineRate" type="number" min="0" max="100" autoComplete="off" />
                <TextField label="Expiry Time (Minutes)" name="expiryTimeMinutes" type="number" min="1" autoComplete="off" />
              </FormLayout.Group>

              {/* Combine Discount Settings */}
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Combine Discount Settings</Text>
                <Text as="p">Select if you want users to combine discounts by type.</Text>

                <InlineGrid columns="1fr 1fr 1fr" gap="400">
                  <Select
                    label="Order Discounts"
                    name="combineWithOrderDiscounts"
                    options={YES_NO_OPTIONS}
                    value={combineOrder}
                    onChange={setCombineOrder}
                  />
                  <Select
                    label="Product Discounts"
                    name="combineWithProductDiscounts"
                    options={YES_NO_OPTIONS}
                    value={combineProduct}
                    onChange={setCombineProduct}
                  />
                  <Select
                    label="Shipping Discounts"
                    name="combineWithShippingDiscounts"
                    options={YES_NO_OPTIONS}
                    value={combineShipping}
                    onChange={setCombineShipping}
                  />
                </InlineGrid>
              </BlockStack>

              <InlineStack align="start" gap="400">
                <Button submit variant="primary" loading={isSubmitting}>
                  Create Program
                </Button>
                <Button url="/app/campaigns">Cancel</Button>
              </InlineStack>
            </FormLayout>
          </RemixForm>
        </Card>
      </BlockStack>
    </Page>
  );
}
