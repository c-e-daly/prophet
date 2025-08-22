// app/routes/app.campaigns.$id.programs.new.tsx  (or app.campaigns.programs.create.tsx if you prefer)
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form as RemixForm, useNavigation, Link } from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, Select, Box } from "@shopify/polaris";
import { authenticate } from "../utils/shopify/shopify.server";
import createClient from "../utils/supabase/server";
import { createShopProgram } from "../lib/queries/createShopProgram";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const campaignId = Number(params.id || new URL(request.url).searchParams.get("campaign"));
  if (!Number.isFinite(campaignId)) throw new Response("Bad campaign id", { status: 400 });

  // optional: verify campaign belongs to shop
  const supabase = createClient();
  const { data: shopRow } = await supabase.from("shops").select("id").eq("shopDomain", session.shop).single();
  const { data: exists } = await supabase.from("campaigns").select("id").eq("shop", shopRow!.id).eq("id", campaignId).single();
  if (!exists) throw new Response("Campaign not found", { status: 404 });

  return json({
    shop: session.shop, campaignId, statusOptions: [
      { label: "Draft", value: "DRAFT" },
      { label: "Active", value: "ACTIVE" },
      { label: "Paused", value: "PAUSED" },
    ]
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const campaignId = Number(params.id || form.get("campaignId"));
  const name = String(form.get("name") || "");
  const type = String(form.get("type") || "");
  const status = String(form.get("status") || "DRAFT") as any;
  const startDate = String(form.get("startDate") || "") || null;
  const endDate = String(form.get("endDate") || "") || null;

  // resolve shopId
  const supabase = createClient();
  const { data: shopRow } = await supabase.from("shops").select("id").eq("shopDomain", session.shop).single();

  await createShopProgram(shopRow!.id, { campaignId, name, type, status, startDate, endDate });

  return redirect(`/app/campaigns?shop=${encodeURIComponent(session.shop)}&createdProgram=1`);
}

export default function ProgramCreate() {
  const { campaignId, shop, statusOptions } = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <Page title="New Program">
      <Box paddingBlockEnd="300">
        <Link to={`/app/campaigns?shop=${encodeURIComponent(shop)}`}>
          <Button variant="plain">Back to campaigns</Button>
        </Link>
      </Box>
      <Card>
        <RemixForm method="post" replace>
          <input type="hidden" name="campaignId" value={campaignId} />
          <FormLayout>
            <TextField label="Name" name="name" autoComplete="off" requiredIndicator />
            <TextField label="Type" name="type" autoComplete="off" />
            <Select label="Status" name="status" options={statusOptions} defaultValue="DRAFT" />
            <FormLayout.Group>
              <TextField label="Start (ISO)" name="startDate" autoComplete="off" />
              <TextField label="End (ISO)" name="endDate" autoComplete="off" />
            </FormLayout.Group>
            <Button submit variant="primary" loading={busy}>Create Program</Button>
          </FormLayout>
        </RemixForm>
      </Card>
    </Page>
  );
}
