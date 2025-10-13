// app/routes/app.campaigns.program._index.tsx
import React from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, useActionData } from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, Select, InlineStack, InlineGrid,
  Banner, BlockStack, Text
} from "@shopify/polaris";
import createClient from "../../supabase/server";
import { createShopProgram } from "../lib/queries/supabase/createShopProgram";
import { getEnumsServer, type EnumMap } from "../lib/queries/supabase/getEnums.server";
import { toOptions } from "../lib/types/enumTypes";
import type { Database } from "../../supabase/database.types";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";


type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type CampaignSummary = {
  id: number;
  name: string | null;
};
type Program = Tables<"programs">;
type ProgramFocus = Database["public"]["Enums"]["programFocus"];
type ProgramStatus = Database["public"]["Enums"]["programStatus"];
type LoaderData = {
  shopsID: number;
  shopDomain: string;
  campaigns: CampaignSummary[]; // Use minimal type
  enums: EnumMap;
};
type ActionData = { error?: string };

const YES_NO_OPTIONS = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];

// ---------- LOADER ----------
export async function loader({ request }: LoaderFunctionArgs) {
  const { shopsID, currentUserId, session} = await getAuthContext(request);    
  const supabase = createClient();
  const [{ data: campaigns, error }, enums] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("shops", shopsID)
      .neq("status", "Archived")
      .order("name"),
    getEnumsServer(),
  ]);

  if (error) throw new Response(error.message, { status: 500 });

  return json<LoaderData>({
    shopsID,
    shopDomain: session.shop,
    campaigns: campaigns ?? [],
    enums,
  });
}

// ---------- ACTION ----------
export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId, currentUserEmail } = await requireAuthContext(request);

  const form = await request.formData();
  const toNumOrNull = (v: FormDataEntryValue | null) => (v == null || v === "" ? null : Number(v));
  const toBool = (v: FormDataEntryValue | null) => v?.toString() === "true";
  const toStr = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";

  const campaignId = Number(form.get("campaignId"));
  if (!campaignId) {
    return json<ActionData>({ error: "Please select a campaign" }, { status: 400 });
  }

  const enums = await getEnumsServer();
  const statusRaw = toStr(form.get("status")) || "Draft";
  const validStatuses = (enums.programStatus ?? []) as ProgramStatus[];
  const status: ProgramStatus = validStatuses.includes(statusRaw as ProgramStatus)
    ? (statusRaw as ProgramStatus)
    : "Draft";

  const focusRaw = toStr(form.get("programFocus"));
  const validFocuses = (enums.programFocus ?? []) as ProgramFocus[];
  const programFocus: ProgramFocus | null = focusRaw && validFocuses.includes(focusRaw as ProgramFocus)
    ? (focusRaw as ProgramFocus)
    : null;

  try {
    await createShopProgram({
      shopsID: shopsID,
      campaigns: campaignId,
      name: toStr(form.get("programName")),
      startDate: form.get("startDate")?.toString() || null,
      endDate: form.get("endDate")?.toString() || null,
      focus: programFocus,
      codePrefix: toStr(form.get("codePrefix")) || null,
      acceptRate: toNumOrNull(form.get("acceptRate")),
      declineRate: toNumOrNull(form.get("declineRate")),
      expiryMinutes: toNumOrNull(form.get("expiryTimeMinutes")),
      combineOrderDiscounts: toBool(form.get("combineOrderDiscounts")),
      combineProductDiscounts: toBool(form.get("combineProductDiscounts")),
      combineShippingDiscounts: toBool(form.get("combineShippingDiscounts")),
      status,
    });

    return redirect("/app/campaigns");
  } catch (err) {
    return json<ActionData>(
      { error: err instanceof Error ? err.message : "Failed to create program" },
      { status: 400 },
    );
  }
}

// ---------- COMPONENT ----------
export default function ProgramCreate() {
  const { campaigns, enums } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const campaignOptions = [
    { label: "Select a campaign", value: "" },
    ...campaigns.map((c: CampaignSummary) => ({
      label: c.name || `Campaign ${c.id}`,
      value: String(c.id),
    })),
  ];

  const statusOptions = toOptions(enums.programStatus || ["Draft", "Active", "Paused", "Archived"]);
  const focusOptions = [{ label: "Select program focus", value: "" }, ...toOptions(enums.programFocus || [])];

  // Form state management
  const [selectedCampaign, setSelectedCampaign] = React.useState("");
  const [programName, setProgramName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [programFocus, setProgramFocus] = React.useState("");
  const [codePrefix, setCodePrefix] = React.useState("");
  const [acceptRate, setAcceptRate] = React.useState("");
  const [declineRate, setDeclineRate] = React.useState("");
  const [expiryTimeMinutes, setExpiryTimeMinutes] = React.useState("");
  const [combineOrder, setCombineOrder] = React.useState("false");
  const [combineProduct, setCombineProduct] = React.useState("false");
  const [combineShipping, setCombineShipping] = React.useState("false");
  const [programStatus, setStatus] = React.useState("Draft");

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
                value={selectedCampaign}
                onChange={setSelectedCampaign}
                requiredIndicator
              />

              <TextField 
                label="Program Name" 
                name="programName" 
                value={programName}
                onChange={setProgramName}
                autoComplete="off" 
                requiredIndicator 
              />

              <Select
                label="Status"
                name="status"
                options={statusOptions}
                value={programStatus}
                onChange={setStatus}
                requiredIndicator
              />

              <FormLayout.Group>
                <TextField 
                  label="Start Date" 
                  name="startDate" 
                  value={startDate}
                  onChange={setStartDate}
                  type="datetime-local" 
                  autoComplete="off" 
                />
                <TextField 
                  label="End Date" 
                  name="endDate" 
                  value={endDate}
                  onChange={setEndDate}
                  type="datetime-local" 
                  autoComplete="off" 
                />
              </FormLayout.Group>

              <FormLayout.Group>
                <Select
                  label="Program Focus"
                  name="programFocus"
                  options={focusOptions}
                  value={programFocus}
                  onChange={setProgramFocus}
                />
                <TextField 
                  label="Code Prefix" 
                  name="codePrefix" 
                  value={codePrefix}
                  onChange={setCodePrefix}
                  autoComplete="off" 
                  helpText="Optional prefix for discount codes" 
                />
              </FormLayout.Group>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Offer Evaluation Settings
                </Text>
                <Text as="p">Select your program offer rates and time for offers to expire.</Text>
                <FormLayout.Group>
                  <TextField 
                    label="Accept Rate (%)" 
                    name="acceptRate" 
                    value={acceptRate}
                    onChange={setAcceptRate}
                    type="number" 
                    min="0" 
                    max="100" 
                    autoComplete="off"
                  />
                  <TextField 
                    label="Decline Rate (%)" 
                    name="declineRate" 
                    value={declineRate}
                    onChange={setDeclineRate}
                    type="number" 
                    min="0" 
                    max="100" 
                    autoComplete="off"
                  />
                  <TextField 
                    label="Expiry Time (Minutes)" 
                    name="expiryTimeMinutes" 
                    value={expiryTimeMinutes}
                    onChange={setExpiryTimeMinutes}
                    type="number" 
                    min="1" 
                    autoComplete="off"
                  />
                </FormLayout.Group>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Combine Discount Settings
                </Text>
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

/*
import React from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, useActionData } from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, Select, InlineStack, InlineGrid,
  Banner, BlockStack, Text
} from "@shopify/polaris";
import createClient from "../../supabase/server";
import { createShopProgram } from "../lib/queries/supabase/createShopProgram";
import { getEnumsServer, type EnumMap } from "../lib/queries/supabase/getEnums.server";
import { toOptions } from "../lib/types/enumTypes";
import type { Database } from "../../supabase/database.types";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type CampaignSummary = {
  id: number;
  campaignName: string | null;
};
type Program = Tables<"programs">;
type ProgramFocus = Database["public"]["Enums"]["programFocus"];
type ProgramStatus = Database["public"]["Enums"]["programStatus"];
type LoaderData = {
  shopsID: number;
  shopDomain: string;
  campaigns: CampaignSummary[]; // Use minimal type
  enums: EnumMap;
};
type ActionData = { error?: string };

const YES_NO_OPTIONS = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];

// ---------- LOADER ----------
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);
  
  const supabase = createClient();
  const [{ data: campaigns, error }, enums] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, campaignName")
      .eq("shops", shopsID)
      .neq("status", "Archived")
      .order("campaignName"),
    getEnumsServer(),
  ]);

  if (error) throw new Response(error.message, { status: 500 });

  return json<LoaderData>({
    shopsID,
    shopDomain: session.shop,
    campaigns: campaigns ?? [],
    enums,
  });
}

// ---------- ACTION ----------
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop);

  const form = await request.formData();
  const toNumOrNull = (v: FormDataEntryValue | null) => (v == null || v === "" ? null : Number(v));
  const toBool = (v: FormDataEntryValue | null) => v?.toString() === "true";
  const toStr = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";

  const campaignId = Number(form.get("campaignId"));
  if (!campaignId) {
    return json<ActionData>({ error: "Please select a campaign" }, { status: 400 });
  }

  const enums = await getEnumsServer();
  const statusRaw = toStr(form.get("status")) || "Draft";
  const validStatuses = (enums.programStatus ?? []) as ProgramStatus[];
  const status: ProgramStatus = validStatuses.includes(statusRaw as ProgramStatus)
    ? (statusRaw as ProgramStatus)
    : "Draft";

  const focusRaw = toStr(form.get("programFocus"));
  const validFocuses = (enums.programFocus ?? []) as ProgramFocus[];
  const programFocus: ProgramFocus | null = focusRaw && validFocuses.includes(focusRaw as ProgramFocus)
    ? (focusRaw as ProgramFocus)
    : null;

  try {
    await createShopProgram({
      shop: shopsID,
      campaign: campaignId,
      programName: toStr(form.get("programName")),
      startDate: form.get("startDate")?.toString() || null,
      endDate: form.get("endDate")?.toString() || null,
      programFocus,
      codePrefix: toStr(form.get("codePrefix")) || null,
      acceptRate: toNumOrNull(form.get("acceptRate")),
      declineRate: toNumOrNull(form.get("declineRate")),
      expiryTimeMinutes: toNumOrNull(form.get("expiryTimeMinutes")),
      combineOrderDiscounts: toBool(form.get("combineOrderDiscounts")),
      combineProductDiscounts: toBool(form.get("combineProductDiscounts")),
      combineShippingDiscounts: toBool(form.get("combineShippingDiscounts")),
      status,
    });

    return redirect("/app/campaigns");
  } catch (err) {
    return json<ActionData>(
      { error: err instanceof Error ? err.message : "Failed to create program" },
      { status: 400 },
    );
  }
}

// ---------- COMPONENT ----------
export default function ProgramCreate() {
  const { campaigns, enums } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const campaignOptions = [
    { label: "Select a campaign", value: "" },
    ...campaigns.map((c: CampaignSummary) => ({
      label: c.campaignName || `Campaign ${c.id}`,
      value: String(c.id),
    })),
  ];

  const statusOptions = toOptions(enums.programStatus || ["Draft", "Active", "Paused", "Archived"]);
  const focusOptions = [{ label: "Select program focus", value: "" }, ...toOptions(enums.programFocus || [])];

  const [selectedCampaign, setSelectedCampaign] = React.useState("");
  const [combineOrder, setCombineOrder] = React.useState("false");
  const [combineProduct, setCombineProduct] = React.useState("false");
  const [combineShipping, setCombineShipping] = React.useState("false");
  const [programStatus, setStatus] = React.useState("Draft");
  const [programFocus, setProgramFocus] = React.useState("");

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
                value={selectedCampaign}
                onChange={setSelectedCampaign}
                requiredIndicator
              />

              <TextField label="Program Name" name="programName" autoComplete="off" requiredIndicator />

              <Select
                label="Status"
                name="status"
                options={statusOptions}
                value={programStatus}
                onChange={setStatus}
                requiredIndicator
              />

              <FormLayout.Group>
                <TextField label="Start Date" name="startDate" type="datetime-local" autoComplete="off" />
                <TextField label="End Date" name="endDate" type="datetime-local" autoComplete="off" />
              </FormLayout.Group>

              <FormLayout.Group>
                <Select
                  label="Program Focus"
                  name="programFocus"
                  options={focusOptions}
                  value={programFocus}
                  onChange={setProgramFocus}
                />
                <TextField label="Code Prefix" name="codePrefix" autoComplete="off" helpText="Optional prefix for discount codes" />
              </FormLayout.Group>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Offer Evaluation Settings
                </Text>
                <Text as="p">Select your program offer rates and time for offers to expire.</Text>
                <FormLayout.Group>
                  <TextField label="Accept Rate (%)" name="acceptRate" type="number" min="0" max="100" autoComplete="off" />
                  <TextField label="Decline Rate (%)" name="declineRate" type="number" min="0" max="100" autoComplete="off" />
                  <TextField label="Expiry Time (Minutes)" name="expiryTimeMinutes" type="number" min="1" autoComplete="off" />
                </FormLayout.Group>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Combine Discount Settings
                </Text>
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

*/