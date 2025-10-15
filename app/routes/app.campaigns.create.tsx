// app/routes/app.campaigns.create.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, InlineGrid, Badge } from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { CAMPAIGN_STATUS_OPTIONS, type CampaignRow, type UpsertCampaignPayload } from "../lib/types/dbTables";
import { DateTimeField } from "../components/dateTimeField";
import { badgeToneForStatus, formatRange } from "../utils/statusHelpers";
import { upsertShopCampaign } from "../lib/queries/supabase/upsertShopCampaign";
import { getShopPendingCampaigns } from "../lib/queries/supabase/getShopPendingCampaigns";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess } from "../utils/flash.server";
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";


// ============================================================================
// Types
// ============================================================================

type LoaderData = {
  pendingCampaigns: CampaignRow[];
  flash: { type: "success" | "error" | "info" | "warning"; message: string } | null;
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const flash = await getFlashMessage(request);

  const pendingCampaigns = await getShopPendingCampaigns(shopsID);
   
  return json<LoaderData>({
    pendingCampaigns: pendingCampaigns || [],
    flash,
  });
};

// ============================================================================
// Action
// ============================================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName } = await requireAuthContext(request);
  const form = await request.formData();

  const parseNullableNumber = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

 const parsePriorities = (v: FormDataEntryValue | null): string[] => {
  try {
    const arr = JSON.parse((v ?? "[]").toString());
    return Array.isArray(arr) ? arr.filter((p: any) => typeof p === 'string' && p.trim()) : [];
  } catch {
    return [];
  }
};

 
  const payload: UpsertCampaignPayload = {
    // No id - create new campaign
    name: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? null,
    codePrefix: form.get("codePrefix")?.toString() ?? null,
    budget: parseNullableNumber(form.get("budget")),
    startDate: form.get("campaignStartDate")?.toString() || null,
    endDate: form.get("campaignEndDate")?.toString() || null,
    priorities: parsePriorities(form.get("campaignGoals")),
    isDefault: false,
    status: form.get("status")?.toString() as any,
    createdByUser: currentUserId,
    createdByUserName: currentUserName,
  };

  try {
    const result = await upsertShopCampaign(shopsID, payload);
    return redirectWithSuccess(`/app/campaigns/${result.id}`, "Campaign created successfully");
  } catch (error) {
    console.error('[Campaign Create] Error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : String(error),
      shopsID,
      campaignName: payload.name,
      timestamp: new Date().toISOString(),
    });

    return json(
      { error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
};

// ============================================================================
// Component
// ============================================================================

export default function CreateCampaignPage() {
  const { pendingCampaigns, flash } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [form, setForm] = React.useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    codePrefix: "",
    status: "Draft",
    budget: "",
    priorities: [] as string[],
  });

  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  const handleAddPriority = () =>
  setForm((prev) => ({
    ...prev,
    priorities: [...prev.priorities, ""],
  }));

  const handlePriorityChange = (index: number, value: string) => {
  const updated = [...form.priorities];
  updated[index] = value;
  setForm((prev) => ({ ...prev, priorities: updated }));
  };

  const handleDeletePriority = (index: number) => {
  const updated = [...form.priorities];
  updated.splice(index, 1);
  setForm((prev) => ({ ...prev, priorities: updated }));
  };

 
  return (
    <Page
      title="Create New Campaign"
      backAction={{ onAction: () => navigate("/app/campaigns") }}
    >
      <FlashBanner flash={flash} />

      <InlineGrid columns={["twoThirds", "oneThird"]} gap="500" alignItems="start">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Campaign Details
            </Text>
            <RemixForm method="post" replace>
              <FormLayout>
                <input type="hidden" name="campaignGoals" value={JSON.stringify(form.priorities)} />
                <input type="hidden" name="campaignStartDate" value={form.startDate} />
                <input type="hidden" name="campaignEndDate" value={form.endDate} />

                <TextField
                  label="Campaign Name"
                  name="campaignName"
                  value={form.name}
                  onChange={handleChange("name")}
                  autoComplete="off"
                  requiredIndicator
                />

                <Select
                  name="status"
                  label="Campaign Status"
                  options={CAMPAIGN_STATUS_OPTIONS}
                  value={form.status}
                  onChange={handleChange("status")}
                  helpText="Current lifecycle state"
                />

                <TextField
                  label="Campaign Description"
                  name="campaignDescription"
                  value={form.description}
                  onChange={handleChange("description")}
                  autoComplete="off"
                  multiline={3}
                />

                <TextField
                  label="Code Prefix"
                  name="codePrefix"
                  value={form.codePrefix}
                  onChange={handleChange("codePrefix")}
                  autoComplete="off"
                  helpText="Optional prefix for discount codes"
                />

                <TextField
                  label="Budget ($)"
                  name="budget"
                  type="number"
                  value={form.budget}
                  onChange={handleChange("budget")}
                  autoComplete="off"
                  inputMode="decimal"
                />

                <InlineStack gap="300">
                  <DateTimeField
                    label="Start Date & Time"
                    value={form.startDate}
                    onChange={handleDateChange("startDate")}
                  />
                  <DateTimeField
                    label="End Date & Time"
                    value={form.endDate}
                    onChange={handleDateChange("endDate")}
                  />
                </InlineStack>

                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Campaign Priorities (Optional)
                    </Text>
                    <Button
                      icon={PlusIcon}
                      onClick={handleAddPriority}
                      variant="plain"
                      size="slim"
                    >
                      Add Goal
                    </Button>
                  </InlineStack>
                 </BlockStack>
                {/* Campaign Priorities */}
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Campaign Priorities (Optional)
                    </Text>
                    <Button
                      icon={PlusIcon}
                      onClick={handleAddPriority}
                      variant="plain"
                      size="slim"
                    >
                      Add Priority
                    </Button>
                  </InlineStack>

                  {form.priorities.length === 0 ? (
                    <Text as="p" tone="subdued" variant="bodySm">
                      Add priorities to guide your campaign strategy.
                    </Text>
                  ) : (
                    <BlockStack gap="200">
                      {form.priorities.map((priority, index) => (
                        <InlineStack key={index} gap="200" align="start" blockAlign="start">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label=""
                              labelHidden
                              value={priority}
                              onChange={(val) => handlePriorityChange(index, val)}
                              placeholder="Acquire new customers, 10% in the top quintile"
                              autoComplete="off"
                            />
                          </div>
                          <Button
                            icon={DeleteIcon}
                            variant="plain"
                            tone="critical"
                            onClick={() => handleDeletePriority(index)}
                            accessibilityLabel="Delete priority"
                          />
                        </InlineStack>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>
                <Button submit variant="primary">
                  Create Campaign
                </Button>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        {/* Pending Campaigns Sidebar */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Pending Campaigns
            </Text>

            {pendingCampaigns.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                No pending campaigns.
              </Text>
            ) : (
              <BlockStack gap="200">
                {pendingCampaigns.map((c) => (
                  <Card key={c.id} padding="300">
                    <InlineStack align="space-between" blockAlign="center" wrap={false}>
                      <BlockStack gap="050">
                        <Text as="h3" variant="headingSm">
                          {c.name || `Campaign #${c.id}`}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {formatRange(c.startDate ?? undefined, c.endDate ?? undefined)}
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={badgeToneForStatus(c.status ?? undefined)}>
                          {c.status ?? "Draft"}
                        </Badge>
                        <Button
                          variant="plain"
                          size="slim"
                          onClick={() => navigate(`/app/campaigns/${c.id}`)}
                        >
                          Edit
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </InlineGrid>
    </Page>
  );
}

export { ErrorBoundary };