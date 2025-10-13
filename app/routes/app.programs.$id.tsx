// app/routes/app.campaigns.programs.$id.tsx
import * as React from "react";
import { json, redirect, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation, useActionData, Link } from "@remix-run/react";
import {  Page, Card, FormLayout, TextField, Button, Select, InlineGrid,
  BlockStack, Banner, Text, Box, InlineStack, type SelectProps
} from "@shopify/polaris";
import type { Tables } from "../lib/types/dbTables";
import { getShopSingleProgram, } from "../lib/queries/supabase/getShopSingleProgram";
import { upsertShopProgram } from "../lib/queries/supabase/upsertShopProgram";
import { deleteShopProgram} from "../lib/queries/supabase/deleteShopProgram";
import { getEnumsServer, type EnumMap } from "../lib/queries/supabase/getEnums.server";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { recordUserActivity } from "../lib/queries/supabase/recordUserActivity";

// ---------- TYPES ----------
type Campaign = Pick<Tables<"campaigns">, "id" | "name">;
type Program = Tables<"programs">;

type LoaderData = {
  program: Program;
  campaigns: Campaign[];
  enums: EnumMap; // Record<string, string[]>;
  shopSession: {
    shopDomain: string;
    shopsID: number;  //supabase row id
    createdByUser: number | undefined;
    createdByUserName: string | undefined;
  }
};

const YES_NO_OPTIONS: SelectProps["options"] = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];


// ---------------- LOADER ----------------
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, currentUserId,currentUserName, session} = await getAuthContext(request);  
  const {id} = params;

  if (!id) throw new Response("Missing program id", { status: 400 });

  const { program, campaigns } = await getShopSingleProgram(shopsID, Number(id));
  const enums = await getEnumsServer();

  return json<LoaderData>({
    program,
    campaigns,
    enums,
    shopSession: {
      shopDomain: session.shop,
      shopsID: shopsID,
      createdByUser: currentUserId,
      createdByUserName: currentUserName
    }
  });
}

// ---------------- ACTION ----------------
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName, currentUserEmail } = await requireAuthContext(request);
  const { id } = params;
  const isEdit = id !== "new";
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  // Handle delete action (only available in edit mode)
  if (intent === "delete" && isEdit) {
    await deleteShopProgram(shopsID, Number(id));
    return redirect(`/app/campaigns?deleted=${id}`);
  }

  const parseNullableNumber = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

 const campaignsValue = parseNullableNumber(form.get("campaigns"));

  // BUILD ONE UNIFIED PAYLOAD
  const payload = {
    ...(isEdit && id && { id: Number(id) }),  // Include ID only if editing
    ...(campaignsValue !== null && { campaigns: campaignsValue }),  // Only include if not null
    name: form.get("programName")?.toString() ?? "",
    description: form.get("programDescription")?.toString() ?? "",
    startDate: form.get("programStartDate")?.toString() || null,
    endDate: form.get("programEndDate")?.toString() || null,
    status: (form.get("status")?.toString() || "Draft") as any,
    budgetGoal: parseNullableNumber(form.get("budgetGoal")),
    offerGoal: parseNullableNumber(form.get("offerGoal")),
    revenueGoal: parseNullableNumber(form.get("revenueGoal")),
    isDefault: form.get("isDefault") === "true",
    createdByUser: currentUserId,
    createdByUserName: currentUserName,
  };

  try {
    // ONE FUNCTION CALL CREATE AND UPDATE
    await upsertShopProgram(shopsID, payload);
    
    // Redirect back to campaign if we know which one, otherwise campaigns list
    const campaignId = payload.campaigns;
    if (campaignId) {
      return redirect(`/app/campaigns/${campaignId}`);
    }
    return redirect(`/app/campaigns`);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} program` },
      { status: 400 }
    );
  }
};

// ---------------- COMPONENT ----------------
export default function ProgramEditCreate() {
  const { program, campaigns, enums, shopSession } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Build Select options from enums (support both snake_case and camelCase)
  const statusList = enums["program_status"] ?? enums["programStatus"] ?? [];
  const focusList = enums["program_focus"] ?? enums["programFocus"] ?? [];

  const statusOptions: SelectProps["options"] =
    statusList.map((v: string) => ({ label: v, value: v }));

  const focusOptions: SelectProps["options"] =
    focusList.map((v: string) => ({ label: v, value: v }));

  const campaignOptions: SelectProps["options"] = React.useMemo(
    () => [
      { label: "Select a campaign", value: "" },
      ...campaigns.map((c) => ({
        label: c.name ?? "—",
        value: String(c.id),
      })),
    ],
    [campaigns]
  );

  // Controlled state from existing program values
  const [campaignId, setCampaignId] = React.useState(
    program.campaigns ? String(program.campaigns) : ""
  );
  const [programName, setProgramName] = React.useState(program.name ?? "");
  const [status, setStatus] = React.useState<string>(program.status ?? "");
  const [programFocus, setProgramFocus] = React.useState<string>(program.focus ?? "");
  const [startDate, setStartDate] = React.useState(program.startDate || "");
  const [endDate, setEndDate] = React.useState(program.endDate || "");
  const [codePrefix, setCodePrefix] = React.useState(program.codePrefix ?? "");
  const [acceptRate, setAcceptRate] = React.useState(
    program.acceptRate != null ? String(program.acceptRate) : ""
  );
  const [declineRate, setDeclineRate] = React.useState(
    program.declineRate != null ? String(program.declineRate) : ""
  );
  const [expiryTimeMinutes, setExpiryTimeMinutes] = React.useState(
    program.expiryMinutes != null ? String(program.expiryMinutes) : ""
  );
  const [combineOrder, setCombineOrder] = React.useState(program.combineOrderDiscounts ? "true" : "false");
  const [combineProduct, setCombineProduct] = React.useState(program.combineProductDiscounts ? "true" : "false");
  const [combineShipping, setCombineShipping] = React.useState(program.combineShippingDiscounts ? "true" : "false");

  return (
    <Page title={`Edit Program: ${program.name ?? ""}`} backAction={{ url: "/app/campaigns" }}>
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>Error updating program: {actionData.error}</p>
          </Banner>
        )}

        <Box paddingBlockEnd="300">
          <InlineStack gap="200" align="start">
            <Link to={`/app/campaigns?shop=${encodeURIComponent(shopSession.shopDomain ?? shopSession.shopDomain)}`}>
              <Button variant="plain">Back to campaigns</Button>
            </Link>
          </InlineStack>
        </Box>

        <Card>
          <form method="post">
            <FormLayout>
              
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />

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
                <DateTimeField
                  label="Start Date & Time"
                  name="startDate"
                  value={program.startDate || ""}
                  onChange={setStartDate}
                />
                <DateTimeField
                  label="End Date & Time"
                  name="endDate"
                  value={program.endDate || ""}
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
                <Button url="/app/programs">Cancel</Button>
              </InlineGrid>
            </FormLayout>
          </form>
        </Card>
      </BlockStack>
    </Page>
  );
}


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
      <TextField label={`${label} (Date)`} type="date" value={dateVal} onChange={setDateVal} autoComplete="off" />
      <TextField label={`${label} (Time)`} type="time" value={timeVal} onChange={setTimeVal} autoComplete="off" />
    </InlineStack>
  );
}
