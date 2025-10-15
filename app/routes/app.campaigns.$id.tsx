// app/routes/app.campaigns.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm, useSubmit } from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack,
  Select, Text, Modal, InlineGrid, Link, Badge } from "@shopify/polaris";
import { DeleteIcon, PlusIcon, EditIcon } from "@shopify/polaris-icons";
import { CAMPAIGN_STATUS_OPTIONS, PROGRAM_GOAL_OPTIONS, GOAL_METRIC_OPTIONS, type CampaignRow,
  type ProgramRow, type UpsertCampaignPayload } from "../lib/types/dbTables";
import { DateTimeField } from "../components/dateTimeField";
import { badgeToneForStatus, formatRange } from "../utils/statusHelpers";
import { getShopSingleCampaign } from "../lib/queries/supabase/getShopSingleCampaign";
import { upsertShopCampaign } from "../lib/queries/supabase/upsertShopCampaign";
import { deleteShopCampaignCascade } from "../lib/queries/supabase/deleteShopCampaignCascade";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess, redirectWithError } from "../utils/flash.server";
import { getShopLatestCampaignDate } from "../lib/queries/supabase/getShopLatestCampaignDate";
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ============================================================================
// Types
// ============================================================================

type LoaderData = {
  campaign: CampaignRow;
  programs: ProgramRow[];
  latestEndDate: string | null;
  flash: { type: "success" | "error" | "info" | "warning"; message: string; } | null;
  session: {
    shopsID: number;
    shopDomain: string;
    currentUserId: number | undefined;
    currentUserName: string | undefined;
  };
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID, session, currentUserId, currentUserName } = await getAuthContext(request);
  const { id } = params;
  const flash = await getFlashMessage(request);

  try {
    /*const result = await getShopSingleCampaign(shopsID, Number(id));*/
    const [result, latestEndDate] = await Promise.all([
    getShopSingleCampaign(shopsID, Number(id)),
    getShopLatestCampaignDate(shopsID, Number(id)), // Exclude current campaign
  ]);


    const campaign = result.campaign;
    const programs = result.programs as ProgramRow[];

    if (!campaign) {
      console.error('[Campaign Loader] Campaign not found:', {
        campaignId: id,
        shopsID,
        timestamp: new Date().toISOString(),
        requestUrl: request.url,
      });

      return redirectWithError(
        "/app/campaigns",
        "Campaign not found. It may have been deleted."
      );
    }

    return json<LoaderData>({
      campaign,
      programs,
      flash,
      latestEndDate,
      session: {
        shopsID,
        shopDomain: session.shop,
        currentUserId,
        currentUserName
      },
    });
  } catch (error) {
    console.error('[Campaign Loader] Error fetching campaign:', {
      campaignId: id,
      shopsID,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
    });

    return redirectWithError(
      "/app/campaigns",
      "Unable to load campaign. Please try again."
    );
  }
};

// ============================================================================
// Action
// ============================================================================

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId, currentUserName } = await requireAuthContext(request);
  const { id } = params;
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  // Handle Delete
  if (intent === "delete") {
    try {
      await deleteShopCampaignCascade(shopsID, Number(id));
      return redirectWithSuccess("/app/campaigns", "Campaign deleted successfully");
    } catch (error) {
      return redirectWithError("/app/campaigns", "Failed to delete campaign. Please try again.");
    }
  }

  // Helper Functions
  const parseNullableNumber = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseGoals = (v: FormDataEntryValue | null) => {
    try {
      const arr = JSON.parse((v ?? "[]").toString()) as Array<{
        type: string;
        metric: string;
        value: string | number;
      }>;
      return arr.map(g => ({
        goal: g.type,
        metric: g.metric,
        value: Number(g.value ?? 0)
      }));
    } catch {
      return [];
    }
  };

  // Build Payload
  const payload: UpsertCampaignPayload = {
    id: Number(id),
    name: form.get("campaignName")?.toString() ?? "",
    description: form.get("campaignDescription")?.toString() ?? null,
    codePrefix: form.get("codePrefix")?.toString() ?? null,
    budget: parseNullableNumber(form.get("budget")),
    startDate: form.get("campaignStartDate")?.toString() || null,
    endDate: form.get("campaignEndDate")?.toString() || null,
    priorities: parseGoals(form.get("campaignGoals")),
    isDefault: false,
    status: form.get("status")?.toString() as any,
    createdByUser: currentUserId,
    createdByUserName: currentUserName,
  };

  // Save Campaign
  try {
    await upsertShopCampaign(shopsID, payload);
    return redirectWithSuccess("/app/campaigns", "Campaign updated successfully");
  } catch (error) {
    console.error('[Campaign Action] Error:', error);

    return json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to update campaign"
      },
      { status: 400 }
    );
  }
};

// ============================================================================
// Component
// ============================================================================

export default function CampaignPage() {
  const { campaign, programs, flash } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [form, setForm] = React.useState(() => {
    const existingGoals = campaign?.goals;
    let parsedGoals: Array<{ type: string; metric: string; value: string | number }> = [];

    if (Array.isArray(existingGoals)) {
      parsedGoals = existingGoals.map(goal => {
        if (typeof goal === 'object' && goal !== null) {
          const g = goal as any;
          return {
            type: g.goal || g.type || "",
            metric: g.goalMetric || g.metric || "",
            value: g.goalValue || g.value || ""
          };
        }
        return { type: "", metric: "", value: "" };
      });
    }

    return {
      name: campaign?.name ?? "",
      description: campaign?.description ?? "",
      startDate: campaign?.startDate ?? "",
      endDate: campaign?.endDate ?? "",
      codePrefix: campaign?.codePrefix ?? "",
      status: campaign?.status ?? "Draft",
      budget: campaign?.budget === null || campaign?.budget === undefined ? "" : String(campaign.budget),
      goals: parsedGoals,
    };
  });

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Event handlers
  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  const handleAddGoal = () =>
    setForm((prev) => ({
      ...prev,
      goals: [...prev.goals, { type: "", metric: "", value: "" }],
    }));

  const handleGoalChange = (index: number, key: "type" | "metric" | "value", value: string) => {
    const updated = [...form.goals];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, goals: updated }));
  };

  const handleDeleteGoal = (index: number) => {
    const updated = [...form.goals];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, goals: updated }));
  };

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    submit(fd, { method: "post" });
  };

  return (
    <Page
      title={`Edit Campaign: ${campaign?.name ?? ""}`}
      backAction={{ onAction: () => navigate("/app/campaigns") }}
      secondaryActions={[
        {
          content: "Delete campaign",
          onAction: () => setDeleteOpen(true),
          destructive: true,
          icon: DeleteIcon,
        },
      ]}
    >
      <FlashBanner flash={flash} />

      <InlineGrid columns={['twoThirds', 'oneThird']} gap="500" alignItems="start">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Campaign Details
            </Text>
            <RemixForm method="post" replace>
              <FormLayout>
                <input type="hidden" name="campaignGoals" value={JSON.stringify(form.goals)} />
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
                  value={String(form.budget ?? "")}
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

                {/* Campaign Goals */}
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Campaign Goals (Optional)
                    </Text>
                    <Button
                      icon={PlusIcon}
                      onClick={handleAddGoal}
                      variant="plain"
                      size="slim"
                    >
                      Add Goal
                    </Button>
                  </InlineStack>

                  {form.goals.length === 0 ? (
                    <Text as="p" tone="subdued" variant="bodySm">
                      Add one or more goals to track campaign success.
                    </Text>
                  ) : (
                    <BlockStack gap="300">
                      {form.goals.map((goal, index) => (
                        <Card key={index} padding="400">
                          <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
                            <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                              <Select
                                label="Type"
                                options={PROGRAM_GOAL_OPTIONS}
                                value={String(goal.type ?? "")}
                                onChange={(v) => handleGoalChange(index, "type", v)}
                              />
                            </div>
                            <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                              <Select
                                label="Metric"
                                options={GOAL_METRIC_OPTIONS}
                                value={String(goal.metric ?? "")}
                                onChange={(v) => handleGoalChange(index, "metric", v)}
                              />
                            </div>
                            <div style={{ flex: "0 0 30%", minWidth: 0 }}>
                              <TextField
                                label="Value"
                                type="number"
                                value={String(goal.value ?? "")}
                                onChange={(v) => handleGoalChange(index, "value", v)}
                                autoComplete="off"
                                inputMode="decimal"
                              />
                            </div>
                            <div style={{ flex: "0 0 auto", paddingTop: "28px" }}>
                              <Button
                                icon={DeleteIcon}
                                variant="plain"
                                tone="critical"
                                onClick={() => handleDeleteGoal(index)}
                                accessibilityLabel="Delete goal"
                              />
                            </div>
                          </InlineStack>
                        </Card>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>

                <InlineStack gap="300" align="start">
                  <Button submit variant="primary">
                    Save Changes
                  </Button>
                  <Button
                    tone="critical"
                    onClick={() => setDeleteOpen(true)}
                    icon={DeleteIcon}
                  >
                    Delete
                  </Button>
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        {/* Programs Sidebar */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Programs in this Campaign
              </Text>
              <Button
                variant="primary"
                icon={PlusIcon}
                size="slim"
                onClick={() => navigate(`/app/programs/create/${campaign.id}`)}
              >
                Create Program
              </Button>
            </InlineStack>

            {programs.length === 0 ? (
              <Text as="p" variant="bodyMd" tone="subdued">
                No programs yet. Create your first program to get started.
              </Text>
            ) : (
              <BlockStack gap="200">
                {programs.map((p) => (
                  <Card key={p.id} padding="300">
                    <InlineStack align="space-between" blockAlign="center" wrap={false}>
                      <BlockStack gap="050">
                        <Text as="h3" variant="headingSm">
                          {p.name || `Program #${p.id}`}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {formatRange(p.startDate ?? undefined, p.endDate ?? undefined)}
                        </Text>
                        {p.focus && (
                          <Text as="p" variant="bodySm">
                            Focus: {p.focus}
                          </Text>
                        )}
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={badgeToneForStatus(p.status ?? undefined)}>
                          {p.status ?? "Draft"}
                        </Badge>
                        <Button
                        variant="primary"
                        icon={EditIcon}
                        size="slim"
                        onClick={() => navigate(`/app/programs/${p.id}`)}>
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

      {/* Delete Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete campaign?"
        primaryAction={{
          content: "Delete campaign",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setDeleteOpen(false) }
        ]}
      >
        <Modal.Section>
          <Text as="p">
            This will permanently delete this campaign and all associated programs.
            This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export { ErrorBoundary };