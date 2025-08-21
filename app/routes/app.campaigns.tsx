// app/routes/app.campaigns.tsx
import * as React from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, useSearchParams, Link, Form as RemixForm,  useSubmit,} from  "@remix-run/react";
import { Page, Card, IndexTable, Text, InlineStack, Button, Badge, Modal, BlockStack, Box, Icon, Tooltip} from "@shopify/polaris";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import { createClient } from "@supabase/supabase-js";
import { withShopLoader } from "../lib/queries/withShopLoader";
// If you have this util from yesterday, keep the import. Otherwise comment it out.
// import { getShopCampaigns, type CampaignRow, type ProgramRow } from "../lib/queries/getShopCampaigns";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";

type CampaignRow = {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null; // ISO
  end_date: string | null;   // ISO
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  budget_cents: number | null;
  created_date?: string | null;
  modified_date?: string | null;
};

type ProgramRow = {
  id: number;
  campaign: number; // FK to campaigns.id
  name: string;
  type: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  start_date: string | null;
  end_date: string | null;
};

type LoaderData = {
  shopDomain: string;
  campaigns: CampaignRow[];
  programsByCampaign: Record<number, ProgramRow[]>;
};

export const loader = (args: LoaderFunctionArgs) =>
  withShopLoader(async ({ shopId, request }) => {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get("shop") ?? "";

    // ===== Preferred: use your shared query util =====
    // const { campaigns, programsByCampaign } = await getShopCampaigns(shopId);

    // ===== Fallback: direct Supabase queries (comment out if using util above) =====
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: campaignsData, error: campErr } = await supabase
      .from("campaigns")
      .select("id,name,description,start_date,end_date,status,budget_cents,created_date,modified_date")
      .eq("shop", shopId)
      .order("created_date", { ascending: false });

    if (campErr) throw campErr;

    const campaignIds = (campaignsData ?? []).map((c) => c.id);
    let programsByCampaign: Record<number, ProgramRow[]> = {};

    if (campaignIds.length > 0) {
      const { data: programsData, error: progErr } = await supabase
        .from("programs")
        .select("id,campaign,name,type,status,start_date,end_date")
        .in("campaign", campaignIds)
        .eq("shop", shopId)
        .order("start_date", { ascending: true });

      if (progErr) throw progErr;

      for (const p of programsData ?? []) {
        (programsByCampaign[p.campaign] ||= []).push(p as ProgramRow);
      }
    }

    const campaigns = (campaignsData ?? []) as CampaignRow[];

    return json<LoaderData>({
      shopDomain,
      campaigns,
      programsByCampaign,
    });
  })(args);

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const campaignId = Number(form.get("campaignId") || "");
  const shopDomain = String(form.get("shop") || "");

  if (intent !== "delete" || !Number.isFinite(campaignId) || !shopDomain) {
    return redirect(`/app/campaigns?shop=${encodeURIComponent(shopDomain)}`);
  }

  // Resolve internal shop id by store_url for safety
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: shopRow, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", shopDomain)
    .single();

  if (shopErr || !shopRow) {
    return redirect(`/app/campaigns?shop=${encodeURIComponent(shopDomain)}&error=shop_not_found`);
  }

  const shopId = shopRow.id as number;

  // Delete children then parent (or rely on FK ON DELETE CASCADE if set)
  const { error: progDelErr } = await supabase
    .from("programs")
    .delete()
    .eq("shop", shopId)
    .eq("campaign", campaignId);

  if (progDelErr) {
    return redirect(`/app/campaigns?shop=${encodeURIComponent(shopDomain)}&error=program_delete_failed`);
  }

  const { error: campDelErr } = await supabase
    .from("campaigns")
    .delete()
    .eq("shop", shopId)
    .eq("id", campaignId);

  if (campDelErr) {
    return redirect(`/app/campaigns?shop=${encodeURIComponent(shopDomain)}&error=campaign_delete_failed`);
  }

  return redirect(`/app/campaigns?shop=${encodeURIComponent(shopDomain)}&deleted=${campaignId}`);
}

export default function CampaignsPage() {
  const { shopDomain, campaigns, programsByCampaign } = useLoaderData<typeof loader>() as LoaderData;
  const [sp] = useSearchParams();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";
  const submit = useSubmit();

  const [expandedCampaignId, setExpandedCampaignId] = React.useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<CampaignRow | null>(null);

  const buildUrl = (path: string) => {
    const params = new URLSearchParams(sp);
    return params.toString() ? `${path}?${params.toString()}` : path;
  };

  const onToggle = (id: number) => {
    setExpandedCampaignId((prev) => (prev === id ? null : id));
  };

  const onConfirmDelete = () => {
    if (!pendingDelete) return;
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("campaignId", String(pendingDelete.id));
    fd.set("shop", shopDomain);
    submit(fd, { method: "post" });
    setDeleteModalOpen(false);
  };

  const CampaignStatusBadge = ({ status }: { status: CampaignRow["status"] }) => {
    const tone =
      status === "ACTIVE"
        ? "success"
        : status === "PAUSED"
        ? "attention"
        : status === "ARCHIVED"
        ? "critical"
        : undefined;
    return <Badge tone={tone}>{status}</Badge>;
  };

  return (
    <Page
      title="Campaigns"
      primaryAction={{
        content: "New campaign",
        url: buildUrl("/app/campaigns/new"), // optional: if you have a create screen
        }}
        >
     <Box paddingBlockEnd="300">
        <InlineStack gap="200" align="start">
          <Link to={`/app?shop=${encodeURIComponent(shopDomain)}`}>
          <Button variant="plain">Back</Button>
          </Link>
        </InlineStack>
      </Box>
      <Card>
        <IndexTable
          resourceName={{ singular: "campaign", plural: "campaigns" }}
          itemCount={campaigns.length}
          selectable={false}
          headings={[
            { title: "Name" },
            { title: "Start" },
            { title: "End" },
            { title: "Status" },
            { title: "Budget" },
            { title: "Actions" },
          ]}
        >
          {campaigns.map((c, idx) => (
            <IndexTable.Row id={String(c.id)} key={c.id} position={idx}>
              <IndexTable.Cell>
                <InlineStack gap="200" align="start">
                  <Button variant="plain" onClick={() => onToggle(c.id)}>
                    {expandedCampaignId === c.id ? "Hide programs" : "View programs"}
                  </Button>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {c.name}
                  </Text>
                </InlineStack>
                {c.description ? (
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      {c.description}
                    </Text>
                  </Box>
                ) : null}
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {c.start_date ? formatDateTime(c.start_date) : "-"}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {c.end_date ? formatDateTime(c.end_date) : "-"}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <CampaignStatusBadge status={c.status} />
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text as="span" variant="bodyMd">
                  {typeof c.budget_cents === "number"
                    ? formatCurrencyUSD(c.budget_cents / 100)
                    : "-"}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <InlineStack gap="100" align="end">
                  <Tooltip content="Edit campaign">
                    <Link to={buildUrl(`/app/campaigns/${c.id}/edit`)}>
                      <Button icon={<Icon source={EditIcon} />} variant="plain" accessibilityLabel="Edit" />
                    </Link>
                  </Tooltip>
                  <Tooltip content="Delete campaign">
                    <Button
                      icon={<Icon source={DeleteIcon} />}
                      tone="critical"
                      variant="plain"
                      loading={isBusy && pendingDelete?.id === c.id}
                      onClick={() => {
                        setPendingDelete(c);
                        setDeleteModalOpen(true);
                      }}
                      accessibilityLabel="Delete"
                    />
                  </Tooltip>
                </InlineStack>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      {/* Programs region (appears when a campaign is selected) */}
      {expandedCampaignId && (
        <Box paddingBlockStart="400">
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Programs for Campaign #{expandedCampaignId}
                </Text>
                <Link to={buildUrl(`/app/programs/new?campaign=${expandedCampaignId}`)}>
                  <Button variant="primary">New program</Button>
                </Link>
              </InlineStack>

              <IndexTable
                resourceName={{ singular: "program", plural: "programs" }}
                itemCount={(programsByCampaign[expandedCampaignId] || []).length}
                selectable={false}
                headings={[
                  { title: "Name" },
                  { title: "Type" },
                  { title: "Status" },
                  { title: "Start" },
                  { title: "End" },
                ]}
              >
                {(programsByCampaign[expandedCampaignId] || []).map((p, i) => (
                  <IndexTable.Row id={String(p.id)} key={p.id} position={i}>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {p.name}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd">{p.type ?? "-"}</Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Badge tone={p.status === "ACTIVE" ? "success" : p.status === "PAUSED" ? "attention" : p.status === "ARCHIVED" ? "critical" : undefined}>
                        {p.status}
                      </Badge>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd">{p.start_date ? formatDateTime(p.start_date) : "-"}</Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd">{p.end_date ? formatDateTime(p.end_date) : "-"}</Text>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </BlockStack>
          </Card>
        </Box>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete campaign?"
        primaryAction={{
          content: "Delete campaign",
          destructive: true,
          onAction: onConfirmDelete,
          loading: isBusy,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setDeleteModalOpen(false) },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text as="p">
              This will permanently delete{" "}
              <b>{pendingDelete?.name}</b> and <b>all programs</b> attached to it for this shop.
            </Text>
            <Text as="p" tone="subdued">
              This action cannot be undone.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Hidden form for posting deletes (fallback; we submit via useSubmit) */}
      <RemixForm method="post" replace hidden>
        <input name="intent" defaultValue="delete" />
        <input name="campaignId" defaultValue="" />
        <input name="shop" defaultValue={shopDomain} />
      </RemixForm>
    </Page>
  );
}
