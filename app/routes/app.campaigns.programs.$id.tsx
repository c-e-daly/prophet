// app/routes/app.campaigns.programs.$id.tsx
import * as React from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, useActionData, Link } from "@remix-run/react";
import {
  Page, Card, FormLayout, TextField, Button, Select, InlineGrid,
  BlockStack, Banner, Text, Box, InlineStack, type SelectProps
} from "@shopify/polaris";

import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import type { Tables } from "../lib/types/dbTables";
import { getShopSingleProgram } from "../lib/queries/getShopSingleProgram";
import { upsertShopSingleProgram } from "../lib/queries/upsertShopSingleProgram";
import { getEnumsServer, type EnumMap } from "../lib/queries/getEnums.server";
import { isoToLocalInput, localInputToIso } from "../utils/format";
import { useShopContext } from "../lib/hooks/useShopContext";

// ---------- TYPES ----------
type Campaign = Pick<Tables<"campaigns">, "id" | "campaignName">;
type Program  = Tables<"programs">;

type LoaderData = {
  shopsId: number;
  shopDomain: string;
  program: Program;
  campaigns: Campaign[];
  enums: EnumMap; // Record<string, string[]>
};

const YES_NO_OPTIONS: SelectProps["options"] = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];

// ---------------- LOADER ----------------
export const loader = withShopLoader(async ({ shopSession, request }) => {
  const { shopsId, shopDomain } = shopSession;

  const url = new URL(request.url);
  const idStr = url.pathname.split("/").pop();
  const programId = Number(idStr);
  if (!programId) throw new Response("Missing program id", { status: 400 });

  const { program, campaigns } = await getShopSingleProgram(shopsId, programId);
  const enums = await getEnumsServer();

  return json<LoaderData>({
    shopsId,
    shopDomain,
    program,
    campaigns,
    enums,
  });
});

// ---------------- ACTION ----------------
export const action = withShopAction(async ({ shopSession, request }) => {
  const { shopsId } = shopSession;

  const url = new URL(request.url);
  const idStr = url.pathname.split("/").pop();
  const programId = Number(idStr);
  if (!programId) return json({ error: "Missing program id" }, { status: 400 });

  const form = await request.formData();
  const toStr = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";
  const toNumOrNull = (v: FormDataEntryValue | null) => {
    const s = toStr(v);
    return s === "" ? null : Number(s);
  };
  const toBool = (v: FormDataEntryValue | null) => toStr(v) === "true";

  const startDateIso = localInputToIso(toStr(form.get("startDate")));
  const endDateIso   = localInputToIso(toStr(form.get("endDate")));
  const statusStr       = toStr(form.get("status"));
  const programFocusStr = toStr(form.get("programFocus"));

  const payload = {
    program: programId,
    shop: shopsId,
    campaigns: Number(toStr(form.get("campaignId")) || 0),
    programName: toStr(form.get("programName")),
    status: statusStr as Program["status"],
    startDate: startDateIso,
    endDate: endDateIso,
    codePrefix: toStr(form.get("codePrefix")) || null,
    programFocus: (programFocusStr || null) as Program["programFocus"],
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
    return redirect("/app/campaigns/programs");
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Failed to update program" },
      { status: 400 }
    );
  }
});

// ---------------- COMPONENT ----------------
export default function ProgramEdit() {
  // ✅ Client-side session via outlet context
  const session = useShopContext();

  const { program, campaigns, shopDomain, enums } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Build Select options from enums (support both snake_case and camelCase)
  const statusList = enums["program_status"] ?? enums["programStatus"] ?? [];
  const focusList  = enums["program_focus"]  ?? enums["programFocus"]  ?? [];

  const statusOptions: SelectProps["options"] =
    statusList.map((v: string) => ({ label: v, value: v }));

  const focusOptions: SelectProps["options"] =
    focusList.map((v: string) => ({ label: v, value: v }));

  const campaignOptions: SelectProps["options"] = React.useMemo(
    () => [
      { label: "Select a campaign", value: "" },
      ...campaigns.map((c) => ({
        label: c.campaignName ?? "—",
        value: String(c.id),
      })),
    ],
    [campaigns]
  );

  // Controlled state from existing program values
  const [campaignId, setCampaignId] = React.useState(
    program.campaigns ? String(program.campaigns) : ""
  );
  const [programName, setProgramName] = React.useState(program.programName ?? "");
  const [status, setStatus] = React.useState<string>(program.status ?? "");
  const [programFocus, setProgramFocus] = React.useState<string>(program.programFocus ?? "");
  const [startDate, setStartDate] = React.useState(isoToLocalInput(program.startDate));
  const [endDate, setEndDate]     = React.useState(isoToLocalInput(program.endDate));
  const [codePrefix, setCodePrefix] = React.useState(program.codePrefix ?? "");
  const [acceptRate, setAcceptRate] = React.useState(
    program.acceptRate != null ? String(program.acceptRate) : ""
  );
  const [declineRate, setDeclineRate] = React.useState(
    program.declineRate != null ? String(program.declineRate) : ""
  );
  const [expiryTimeMinutes, setExpiryTimeMinutes] = React.useState(
    program.expiryTimeMinutes != null ? String(program.expiryTimeMinutes) : ""
  );
  const [combineOrder, setCombineOrder] = React.useState(program.combineOrderDiscounts ? "true" : "false");
  const [combineProduct, setCombineProduct] = React.useState(program.combineProductDiscounts ? "true" : "false");
  const [combineShipping, setCombineShipping] = React.useState(program.combineShippingDiscounts ? "true" : "false");

  return (
    <Page title={`Edit Program: ${program.programName ?? ""}`} backAction={{ url: "/app/campaigns/programs" }}>
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>Error updating program: {actionData.error}</p>
          </Banner>
        )}

        <Box paddingBlockEnd="300">
          <InlineStack gap="200" align="start">
            <Link to={`/app/campaigns?shop=${encodeURIComponent(session.shopDomain ?? shopDomain)}`}>
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

              <Select
                label="Status"
                name="status"
                options={statusOptions}
                value={status}
                onChange={setStatus}
                requiredIndicator
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
                <Select
                  label="Program Focus"
                  name="programFocus"
                  options={focusOptions}
                  value={programFocus}
                  onChange={setProgramFocus}
                  requiredIndicator
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
                <Button url="/app/campaigns/programs">Cancel</Button>
              </InlineGrid>
            </FormLayout>
          </form>
        </Card>
      </BlockStack>
    </Page>
  );
}
