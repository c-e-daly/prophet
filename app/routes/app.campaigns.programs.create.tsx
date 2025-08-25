// app/routes/app.campaigns.$id.programs.create.tsx
import * as React from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, Link } from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, Select, Box } from "@shopify/polaris";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { withShopAction } from "../lib/queries/withShopAction";
import { createClient } from "../utils/supabase/server";
import { createShopProgram } from "../lib/queries/createShopProgram";
import type { Program } from "../lib/queries/types/enumTypes";

type LoaderData = {
  shopDomain: string;
  host: string | null;
  shopId: number;
  campaignId: number;
  statusOptions: { label: string; value: Program["status"] }[];
};

// Helper to extract :id from pathname if needed
function getCampaignIdFromUrl(request: Request): number | null {
  const url = new URL(request.url);
  // try query first (?campaign=123), else parse from /app/campaigns/:id/...
  const q = url.searchParams.get("campaign");
  if (q && Number.isFinite(Number(q))) return Number(q);
  const m = url.pathname.match(/\/app\/campaigns\/(\d+)\/programs\/create/i);
  return m ? Number(m[1]) : null;
}

// ---------- LOADER ----------
export const loader = withShopLoader(async ({ shopId, shopDomain, request }) => {
  const url = new URL(request.url);
  const host = url.searchParams.get("host") ?? null;

  const campaignId = getCampaignIdFromUrl(request);
  if (!Number.isFinite(campaignId)) throw new Response("Bad campaign id", { status: 400 });

  // Verify the campaign belongs to this shop
  const supabase = createClient();
  const { data: exists, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("shop", shopId)
    .eq("id", campaignId!)
    .maybeSingle();

  if (error) throw new Response(error.message, { status: 500 });
  if (!exists) throw new Response("Campaign not found", { status: 404 });

  const statusOptions: LoaderData["statusOptions"] = [
    { label: "Draft", value: "DRAFT" },
    { label: "Active", value: "ACTIVE" },
    { label: "Paused", value: "PAUSED" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  return json<LoaderData>({
    shopDomain,
    host,
    shopId,
    campaignId: campaignId!,
    statusOptions,
  });
});

// ---------- ACTION ----------
export const action = withShopAction(async ({ shopId, shopDomain, request }) => {
  const form = await request.formData();

  // Prefer posted field; fallback to URL parsing
  const postedId = form.get("campaignId");
  const campaignId = Number(postedId ?? getCampaignIdFromUrl(request));
  if (!Number.isFinite(campaignId)) throw new Response("Bad campaign id", { status: 400 });

  const name = String(form.get("name") ?? "");
  const type = String(form.get("type") ?? "");
  const status = String(form.get("status") ?? "DRAFT") as Program["status"];
  const startDate = (form.get("startDate")?.toString() || null) as string | null;
  const endDate = (form.get("endDate")?.toString() || null) as string | null;

  await createShopProgram(shopId, { campaignId, name, type, status, startDate, endDate });

  const host = form.get("host")?.toString();
  return redirect(
    `/app/campaigns?shop=${encodeURIComponent(shopDomain)}${host ? `&host=${encodeURIComponent(host)}` : ""
    }&createdProgram=1`
  );
});

// ---------- COMPONENT ----------
export default function ProgramCreate() {
  const { shopDomain, host, campaignId, statusOptions } = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  const backHref =
    `/app/campaigns?shop=${encodeURIComponent(shopDomain)}` +
    (host ? `&host=${encodeURIComponent(host)}` : "");

  // Polaris Select must be controlled; mirror to hidden input
  const [status, setStatus] = React.useState<Program["status"]>("DRAFT");

  return (
    <Page title="New Program">
      <Box paddingBlockEnd="300">
        <Link to={backHref}>
          <Button variant="plain">Back to campaigns</Button>
        </Link>
      </Box>

      <Card>
        <RemixForm method="post" replace>
          <input type="hidden" name="campaignId" value={String(campaignId)} />
          <input type="hidden" name="status" value={status} />
          {host ? <input type="hidden" name="host" value={host} /> : null}

          <FormLayout>
            <TextField label="Name" name="name" autoComplete="off" requiredIndicator />
            <TextField label="Type" name="type" autoComplete="off" />

            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(v) => setStatus(v as Program["status"])}
            />

            <FormLayout.Group>
              <TextField label="Start (ISO)" name="startDate" autoComplete="off" />
              <TextField label="End (ISO)" name="endDate" autoComplete="off" />
            </FormLayout.Group>

            <Button submit variant="primary" loading={busy}>
              Create Program
            </Button>
          </FormLayout>
        </RemixForm>
      </Card>
    </Page>
  );
}
