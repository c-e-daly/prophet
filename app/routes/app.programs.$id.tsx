// app/routes/app.programs.$id.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Form as RemixForm, useSubmit,} from "@remix-run/react";
import { Page, Card, BlockStack, FormLayout, TextField, Button, InlineStack, Select,
  Text, Modal, InlineGrid, Link, Badge, DataTable,} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { PROGRAM_STATUS_OPTIONS, PROGRAM_FOCUS_OPTIONS, PROGRAM_GOAL_OPTIONS,  GOAL_METRIC_OPTIONS,
  YES_NO_OPTIONS,  type ProgramRow,  type ProgramGoalsRow,  type CampaignRow,  type UpsertProgramPayload,
  ProgramStatusEnum,
} from "../lib/types/dbTables";
import { DateTimeField } from "../components/dateTimeField";
import { badgeToneForStatus, formatRange } from "../utils/statusHelpers";
import { formatCurrencyUSD } from "../utils/format";
import { getShopSingleProgram } from "../lib/queries/supabase/getShopSingleProgram";
import { upsertShopProgram } from "../lib/queries/supabase/upsertShopCampaignProgram";
import { deleteShopProgram } from "../lib/queries/supabase/deleteShopProgram";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { getFlashMessage, redirectWithSuccess, redirectWithError } from "../utils/flash.server";
import { FlashBanner } from "../components/FlashBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { getShopsID } from "../../supabase/getShopsID.server";

// ============================================================================
// Types
// ============================================================================

type LoaderData = {
  program: ProgramRow;
  campaign: CampaignRow;
  programGoals: ProgramGoalsRow[]; // ALWAYS an array
  siblingPrograms: ProgramRow[];
  flash: { type: "success" | "error" | "info" | "warning"; message: string } | null;
};

// ============================================================================
// Loader
// ============================================================================

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const { id } = params;
  const flash = await getFlashMessage(request);

  try {
    const result = await getShopSingleProgram(shopsID, Number(id));
      if (!result.program) return redirectWithError("/app/campaigns", "Program not found.");
      if (!result.campaign) return redirectWithError("/app/campaigns", "Campaign not found for this program.");

   const campaigns = result.campaign as CampaignRow | unknown;
      
    // Sibling programs
    const allPrograms: ProgramRow[] = Array.isArray(result.program) ? result.program : [];
    const siblingPrograms = allPrograms.filter((p) => p.id !== result.program?.id);
 
  return json({
  program: result.program,
  campaign: result.campaign,
  programGoals: result.programGoals,       
  siblingPrograms: result.siblingPrograms, 
  flash,
} satisfies LoaderData);

  } catch (error) {
    return redirectWithError("/app/campaigns", "Unable to load program.");
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

  if (intent === "delete") {
    try {
      const campaignId = form.get("campaignId")?.toString();
      await deleteShopProgram(shopsID, Number(id));
      return campaignId
        ? redirectWithSuccess(`/app/campaigns/${campaignId}`, "Program deleted successfully")
        : redirectWithSuccess("/app/campaigns", "Program deleted successfully");
    } catch (error) {
      return redirectWithError("/app/campaigns", "Failed to delete program.");
    }
  }

  // helpers
  const num = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null;
    const s = v.toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: FormDataEntryValue | null) => v?.toString().trim() ?? "";
  const strOrUndef = (v: FormDataEntryValue | null): string | undefined => {
  const s = v?.toString().trim();
  return s || undefined;
};
  const pickFrom = (val: string | undefined, opts: readonly { value: string; label: string }[]) =>
  val && opts.some(o => o.value === val) ? val : undefined;
  const statusRaw = strOrUndef(form.get("status"));
  const focusRaw  = strOrUndef(form.get("programFocus"));
    

  // Build payload
  const payload: UpsertProgramPayload = {
    id: Number(id),
    campaigns: num(form.get("campaigns")) ?? undefined,
    name: str(form.get("programName")) || "",
    description: str(form.get("programDescription")) || null,
    startDate: str(form.get("programStartDate")) || null,
    endDate: str(form.get("programEndDate")) || null,
    status: pickFrom(statusRaw, PROGRAM_STATUS_OPTIONS) as any, 
    focus:  pickFrom(focusRaw,  PROGRAM_FOCUS_OPTIONS) ?? null as any,    
    codePrefix: str(form.get("codePrefix")) || "",
    acceptRate: num(form.get("acceptRate")) || undefined,
    declineRate: num(form.get("declineRate")) || undefined,
    expiryMinutes: num(form.get("expiryMinutes")),
    combineOrderDiscounts: str(form.get("combineOrderDiscounts")) === "true",
    combineProductDiscounts: str(form.get("combineProductDiscounts")) === "true",
    combineShippingDiscounts: str(form.get("combineShippingDiscounts")) === "true",
    goalType: (str(form.get("goalType")) || null) as any,
    goalMetric: (str(form.get("goalMetric")) || null) as any,
    goalValue: num(form.get("goalValue")),
    isDefault: false,
    createdByUser: currentUserId,
    createdByUserName: currentUserName,
  };

  try {
    await upsertShopProgram(shopsID, payload);
    return payload.campaigns
      ? redirectWithSuccess(`/app/campaigns/${payload.campaigns}`, "Program updated successfully")
      : redirectWithSuccess("/app/campaigns", "Program updated successfully");
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to update program" },
      { status: 400 }
    );
  }
};

// ============================================================================
// Component
// ============================================================================

export default function ProgramPage() {
  const { program, campaign, programGoals, siblingPrograms, flash } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  // pick recommended goal (by isRecommended flag if present) → else first → else empty
  const recommended = React.useMemo(() => {
    const withFlag = programGoals.find((g) => (g as any).isRecommended === true);
    return withFlag ?? programGoals[0] ?? null;
  }, [programGoals]);

  // Local form state (Polaris Selects must always get strings, not null)
  const [form, setForm] = React.useState(() => ({
    name: program.name ?? "",
    description: program.description ?? "",
    startDate: program.startDate ?? "",
    endDate: program.endDate ?? "",
    status: (program.status ?? "Draft") as string,
    focus: (program.focus ?? "") as string,
    codePrefix: program.codePrefix ?? "",
    acceptRate: program.acceptRate != null ? String(program.acceptRate) : "",
    declineRate: program.declineRate != null ? String(program.declineRate) : "",
    expiryMinutes: program.expiryMinutes != null ? String(program.expiryMinutes) : "",
    combineOrderDiscounts: program.combineOrderDiscounts ? "true" : "false",
    combineProductDiscounts: program.combineProductDiscounts ? "true" : "false",
    combineShippingDiscounts: program.combineShippingDiscounts ? "true" : "false",

    // recommended goal fields for edit
    goalType: recommended?.goalType ?? "",
    goalMetric: recommended?.goalMetric ?? "",
    goalValue: recommended?.goalValue != null ? String(recommended.goalValue) : "",
    goalId: recommended?.id != null ? String(recommended.id) : "",
  }));

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleChange = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDateChange = (field: "startDate" | "endDate") => (iso: string) =>
    setForm((prev) => ({ ...prev, [field]: iso }));

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("campaignId", String(campaign.id));
    submit(fd, { method: "post" });
  };

  // Render table of *other* goals (read-only)
  const otherGoals = programGoals.filter((g) => String(g.id) !== form.goalId);
  const goalsRows = otherGoals.map((g) => [
    g.goalType ?? "-",
    g.goalMetric ?? "-",
    g.goalValue != null ? String(g.goalValue) : "-",
    new Date(g.created_at).toLocaleString(),
  ]);

  return (
    <Page
      title={`Edit Program: ${program.name ?? ""}`}
      backAction={{ onAction: () => navigate(`/app/campaigns/${campaign.id}`) }}
      secondaryActions={[
        {
          content: "Delete program",
          onAction: () => setDeleteOpen(true),
          destructive: true,
          icon: DeleteIcon,
        },
      ]}
    >
      <FlashBanner flash={flash} />

      <InlineGrid columns={["twoThirds", "oneThird"]} gap="500" alignItems="start">
        {/* LEFT: editor */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Program Details
            </Text>

            <RemixForm method="post" replace>
              <FormLayout>
                <input type="hidden" name="campaigns" value={campaign.id} />
                <input type="hidden" name="programStartDate" value={form.startDate} />
                <input type="hidden" name="programEndDate" value={form.endDate} />

                <TextField
                  label="Campaign"
                  value={campaign.name ?? ""}
                  autoComplete="off"
                  readOnly
                  disabled
                  helpText="Programs cannot be moved between campaigns"
                />

                <TextField
                  label="Program Name"
                  name="programName"
                  value={form.name}
                  onChange={handleChange("name")}
                  autoComplete="off"
                  requiredIndicator
                />

                <TextField
                  label="Description"
                  name="programDescription"
                  value={form.description}
                  onChange={handleChange("description")}
                  autoComplete="off"
                  multiline={2}
                />
                <InlineGrid gap="300" columns={3}>
                  <Select
                    name="programFocus"
                    label="Focus"
                    options={PROGRAM_FOCUS_OPTIONS}
                    value={form.focus}
                    onChange={handleChange("focus")}
                  />
                  <TextField
                    label="Code Prefix"
                    name="codePrefix"
                    value={form.codePrefix}
                    onChange={handleChange("codePrefix")}
                    autoComplete="off"
                  />
                
                    <Select
                      name="status"
                      label="Status"
                      options={PROGRAM_STATUS_OPTIONS}
                      value={form.status}
                      onChange={handleChange("status")}
                      requiredIndicator
                    />
              </InlineGrid>  
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                      Program Dates
                  </Text>
                  <InlineGrid gap="300" columns={2}>
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
                  </InlineGrid>
                 </BlockStack>    
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Offer Evaluation
                  </Text>
                  <InlineGrid gap="300" columns={3}>
                    <TextField
                      label="Accept Rate (%)"
                      name="acceptRate"
                      type="number"
                      value={form.acceptRate}
                      onChange={handleChange("acceptRate")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Decline Rate (%)"
                      name="declineRate"
                      type="number"
                      value={form.declineRate}
                      onChange={handleChange("declineRate")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Expiry (Min)"
                      name="expiryMinutes"
                      type="number"
                      value={form.expiryMinutes}
                      onChange={handleChange("expiryMinutes")}
                      autoComplete="off"
                    />
                  </InlineGrid>
                </BlockStack>
                 <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Combine Discounts
                  </Text>
                  <InlineGrid gap="300" columns={3}>
                    <Select
                      label="Order"
                      name="combineOrderDiscounts"
                      options={YES_NO_OPTIONS}
                      value={form.combineOrderDiscounts}
                      onChange={handleChange("combineOrderDiscounts")}
                    />
                    <Select
                      label="Product"
                      name="combineProductDiscounts"
                      options={YES_NO_OPTIONS}
                      value={form.combineProductDiscounts}
                      onChange={handleChange("combineProductDiscounts")}
                    />
                    <Select
                      label="Shipping"
                      name="combineShippingDiscounts"
                      options={YES_NO_OPTIONS}
                      value={form.combineShippingDiscounts}
                      onChange={handleChange("combineShippingDiscounts")}
                    />
                  </InlineGrid>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Recommended Goal
                  </Text>
                  <InlineGrid gap="300" columns={3}>
                    <Select
                      label="Goal Type"
                      name="goalType"
                      options={PROGRAM_GOAL_OPTIONS}
                      value={form.goalType}
                      onChange={handleChange("goalType")}
                    />
                    <Select
                      label="Goal Metric"
                      name="goalMetric"
                      options={GOAL_METRIC_OPTIONS}
                      value={form.goalMetric}
                      onChange={handleChange("goalMetric")}
                    />
                    <TextField
                      label="Goal Value"
                      name="goalValue"
                      type="number"
                      value={form.goalValue}
                      onChange={handleChange("goalValue")}
                      autoComplete="off"
                    />
                    <input type="hidden" name="goalId" value={form.goalId} />
                  </InlineGrid>
                </BlockStack>

                <InlineStack gap="300">
                  <Button submit 
                    variant="primary"
                    >
                    Save Program
                  </Button>
                  <Button 
                  tone="critical" 
                  onClick={() => setDeleteOpen(true)}
                   icon={DeleteIcon}>
                    Delete
                  </Button>
                </InlineStack>
              </FormLayout>
            </RemixForm>
          </BlockStack>
        </Card>

        {/* RIGHT: context cards */}
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Campaign
              </Text>
              <Card background="bg-surface-secondary" padding="300">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" fontWeight="semibold">
                    {campaign.name}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {formatRange(campaign.startDate ?? "", campaign.endDate ?? "")}
                  </Text>
                  {campaign.budget && (
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodySm" tone="subdued">
                        Budget:
                      </Text>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        {formatCurrencyUSD((campaign.budget ?? 0) * 100)}
                      </Text>
                    </InlineStack>
                  )}
                  <Link onClick={() => navigate(`/app/campaigns/${campaign.id}`)}>
                    View Campaign
                  </Link>
                </BlockStack>
              </Card>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Other Programs
                </Text>
                <Button
                  variant="plain"
                  size="slim"
                  onClick={() => navigate(`/app/programs/new?id=${campaign.id}`)}
                >
                  Add
                </Button>
              </InlineStack>

              {siblingPrograms.length === 0 ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  No other programs yet.
                </Text>
              ) : (
                <BlockStack gap="200">
                  {siblingPrograms.map((p) => (
                    <Link key={p.id} onClick={() => navigate(`/app/programs/${p.id}`)} removeUnderline>
                      <Card padding="300">
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodySm">{p.name || `Program #${p.id}`}</Text>
                          <Badge tone={badgeToneForStatus(p.status ?? "")}>{p.status}</Badge>
                        </InlineStack>
                      </Card>
                    </Link>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">All Goals</Text>
              {programGoals.length === 0 ? (
                <Text as="p" variant="bodySm" tone="subdued">No goals yet.</Text>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["Type", "Metric", "Value", "Created"]}
                  rows={goalsRows}
                />
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete program?"
        primaryAction={{
          content: "Delete program",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setDeleteOpen(false) }]}
      >
        <Modal.Section>
          <Text as="p">This will permanently delete this program. This action cannot be undone.</Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export { ErrorBoundary };

