// app/routes/app.campaigns.program.tsx
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, useActionData } from "@remix-run/react";
import React from "react";
import {
  Page, Card, FormLayout, TextField, Button, Select, InlineStack, InlineGrid, Banner, BlockStack, Text
} from "@shopify/polaris";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import { createClient } from "../utils/supabase/server";
import { createShopProgram } from "../lib/queries/createShopProgram";
import type { Database } from "../../supabase/database.types";
import { DynamicEnumType } from "../components/enums";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type Campaign = Tables<"campaigns">;
type Program  = Tables<"programs">;

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
  return json({ shopDomain, shopId, campaigns: campaigns ?? [] });
});

// ---------- ACTION ----------
export const action = withShopAction(async ({ shopId, request }) => {
  const form = await request.formData();

  // Basic coercers
  const toNumOrNull = (v: FormDataEntryValue | null) =>
    v === null || v === "" ? null : Number(v);
  const toBool = (v: FormDataEntryValue | null) => v?.toString() === "true";
  const toStr = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";

  const campaignId = Number(form.get("campaignId"));
  if (!campaignId) {
    return json({ error: "Please select a campaign" }, { status: 400 });
  }

  // NOTE: No second Supabase query here.
  // We trust RLS / FKs to ensure the campaign belongs to this shop.
  // If you don’t have that yet, see notes below.

  try {
    await createShopProgram({
      shop: shopId,
      campaign: campaignId,
      programName: toStr(form.get("programName")),
      startDate: form.get("startDate")?.toString() || null,
      endDate: form.get("endDate")?.toString() || null,
      programFocus: form.get("programFocus")?.toString() || undefined,
      codePrefix: toStr(form.get("codePrefix")) || null,
      acceptRate: toNumOrNull(form.get("acceptRate")),
      declineRate: toNumOrNull(form.get("declineRate")),
      expiryTimeMinutes: toNumOrNull(form.get("expiryTimeMinutes")),
      combineOrderDiscounts: toBool(form.get("combineOrderDiscounts")),
      combineProductDiscounts: toBool(form.get("combineProductDiscounts")),
      combineShippingDiscounts: toBool(form.get("combineShippingDiscounts")),
      status: (form.get("status")?.toString() || "Draft") as Program["status"],
    });

    // Back to campaigns index
    return redirect("/app/campaigns");
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Failed to create program" },
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
  const [status, setStatus] = React.useState<string>("");          // maps to name="status"
  const [programFocus, setProgramFocus] = React.useState<string>("");

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
              <Select
                label="Campaign"
                name="campaignId"
                options={campaignOptions}
                requiredIndicator
              />

              <TextField
                label="Program Name"
                name="programName"
                autoComplete="off"
                requiredIndicator
              />

              {/* Keep enum fields uncontrolled to avoid needing local form state here */}
              <DynamicEnumType
                mode="select"
                enumKey="program_status"
                name="status"
                label="Status"
                value={status}
                onChange={setStatus}
                required
                helpText="Initial program status"
              />

              <FormLayout.Group>
                <TextField label="Start Date" name="startDate" type="datetime-local" autoComplete="off" />
                <TextField label="End Date"   name="endDate"   type="datetime-local" autoComplete="off" />
              </FormLayout.Group>

              <FormLayout.Group>
                <DynamicEnumType
                  mode="select"
                  enumKey="program_focus"
                  name="programFocus"
                  label="Program Focus"
                  value={programFocus}
                  onChange={setProgramFocus}
                  required
                  helpText="Main focus for the program"
                />
                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  autoComplete="off"
                  helpText="Optional prefix for discount codes"
                />
              </FormLayout.Group>

              {/* Accept / Decline / Expiry */}
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Offer Evaluation Settings</Text>
                <Text as="p">Select your program offer rates and time for offers to expire.</Text>
                <FormLayout.Group>
                  <TextField label="Accept Rate (%)" name="acceptRate" type="number" min="0" max="100" autoComplete="off" />
                  <TextField label="Decline Rate (%)" name="declineRate" type="number" min="0" max="100" autoComplete="off" />
                  <TextField label="Expiry Time (Minutes)" name="expiryTimeMinutes" type="number" min="1" autoComplete="off" />
                </FormLayout.Group>
              </BlockStack>

              {/* Combine Discount Settings (3 columns) */}
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Combine Discount Settings</Text>
                <Text as="p">Select if you want users to combine discounts by type.</Text>

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
