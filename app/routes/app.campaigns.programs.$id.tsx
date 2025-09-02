// app/routes/app.campaigns.programs.$id.tsx
import * as React from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation, useActionData, Link} from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, Select, InlineGrid, BlockStack, Banner, Text, Box, InlineStack} from "@shopify/polaris";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import type { Tables } from "../lib/types/dbTables";
import { DynamicEnumType } from "../components/enums";
import { getShopSingleProgram } from "../lib/queries/getShopSingleProgram";
import { upsertShopSingleProgram } from "../lib/queries/upsertShopSingleProgram";

type Campaign = Pick<Tables<"campaigns">, "id" | "campaignName">;
type Program  = Tables<"programs">;

const YES_NO_OPTIONS = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];

// convert ISO to input[type=datetime-local] value (YYYY-MM-DDTHH:mm)
const toLocalInput = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

// ---------------- LOADER ----------------
export const loader = withShopLoader(async ({ shopId, request }) => {
  // pull ":id" from the URL because withShopLoader doesn't give us params
  const url = new URL(request.url);
  const segments = url.pathname.split("/"); // e.g. ["", "app", "campaigns", "programs", "123"]
  const idStr = segments[segments.length - 1];
  const programId = Number(idStr);

  if (!programId) throw new Response("Missing program id", { status: 400 });

  const { program, campaigns } = await getShopSingleProgram(shopId, programId);
  return json({ shopId, program, campaigns });
});

// ---------------- ACTION ----------------
export const action = withShopAction(async ({ shopId, request, params }: { shopId: number; request: Request; params: ActionFunctionArgs["params"] }) => {
  const programId = Number(params.id);
  if (!programId) return json({ error: "Missing program id" }, { status: 400 });

  const form = await request.formData();

  const toStr = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";
  const toNumOrNull = (v: FormDataEntryValue | null) =>
    v === null || v === "" ? null : Number(v);
  const toBool = (v: FormDataEntryValue | null) => v?.toString() === "true";

  const payload = {
    program: programId,
    shop: shopId,
    campaign: Number(form.get("campaignId") || 0),
    programName: toStr(form.get("programName")),
    status: toStr(form.get("status")) as Program["status"],
    startDate: toStr(form.get("startDate")) || null,
    endDate: toStr(form.get("endDate")) || null,
    codePrefix: toStr(form.get("codePrefix")) || null,
    programFocus: (toStr(form.get("programFocus")) || null) as Program["programFocus"],
    expiryTimeMinutes: toNumOrNull(form.get("expiryTimeMinutes")),
    combineOrderDiscounts: toBool(form.get("combineOrderDiscounts")),
    combineProductDiscounts: toBool(form.get("combineProductDiscounts")),
    combineShippingDiscounts: toBool(form.get("combineShippingDiscounts")),
    isDefault: toBool(form.get("isDefault")),
    acceptRate: toNumOrNull(form.get("acceptRate")),
    declineRate: toNumOrNull(form.get("declineRate")),
    modifiedBy: "system",
  } as const;

  try {
    await upsertShopSingleProgram(payload as any);
    return redirect("/app/campaigns");
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to update program" }, { status: 400 });
  }
});

// ---------------- COMPONENT ----------------
export default function ProgramEdit() {
  const { program, campaigns } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // controlled state from program
  const [campaignId, setCampaignId]     = React.useState(program.campaign ? String(program.campaign) : "");
  const [programName, setProgramName]   = React.useState(program.programName ?? "");
  const [status, setStatus]             = React.useState<string>(program.status ?? "");
  const [programFocus, setProgramFocus] = React.useState<string>(program.programFocus ?? "");
  const [startDate, setStartDate]       = React.useState(toLocalInput(program.startDate));
  const [endDate, setEndDate]           = React.useState(toLocalInput(program.endDate));
  const [codePrefix, setCodePrefix]     = React.useState(program.codePrefix ?? "");
  const [acceptRate, setAcceptRate]     = React.useState(program.acceptRate != null ? String(program.acceptRate) : "");
  const [declineRate, setDeclineRate]   = React.useState(program.declineRate != null ? String(program.declineRate) : "");
  const [expiryTimeMinutes, setExpiryTimeMinutes] = React.useState(program.expiryTimeMinutes != null ? String(program.expiryTimeMinutes) : "");
  const [combineOrder, setCombineOrder]       = React.useState(program.combineOrderDiscounts ? "true" : "false");
  const [combineProduct, setCombineProduct]   = React.useState(program.combineProductDiscounts ? "true" : "false");
  const [combineShipping, setCombineShipping] = React.useState(program.combineShippingDiscounts ? "true" : "false");

  const campaignOptions = React.useMemo(
    () => [{ label: "Select a campaign", value: "" }, ...campaigns.map((c: Campaign) => ({ label: c.campaignName, value: String(c.id) }))],
    [campaigns]
  );

  return (
    <Page title={`Edit Program: ${program.programName ?? ""}`} backAction={{ url: "/app/campaigns" }}>
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>Error updating program: {actionData.error}</p>
          </Banner>
        )}
        <Box paddingBlockEnd="300">
        <InlineStack gap="200" align="start">
          <Link to={`/app/campaigns?shop=${encodeURIComponent(shop)}`}>
            <Button variant="plain">Back to campaigns</Button>
          </Link>
        </InlineStack>
      </Box>
        <Card>
          <form method="post">
            <FormLayout>
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

              <DynamicEnumType
                mode="select"
                enumKey="program_status"
                name="status"
                label="Status"
                value={status}
                onChange={setStatus}
                required
                helpText="Current program status"
              />

              <FormLayout.Group>
                <TextField
                  label="Start Date"
                  name="startDate"
                  type="datetime-local"
                  autoComplete="off"
                  value={startDate}
                  onChange={setStartDate}
                />
                <TextField
                  label="End Date"
                  name="endDate"
                  type="datetime-local"
                  autoComplete="off"
                  value={endDate}
                  onChange={setEndDate}
                />
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
                <Button url="/app/campaigns">Cancel</Button>
              </InlineGrid>
            </FormLayout>
          </form>
        </Card>
      </BlockStack>
    </Page>
  );
}
