// app/routes/app.pricebuilder.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {  Page, Layout, Card, Button, InlineStack, BlockStack, Text, Divider, Badge, Banner
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getShopSession } from "../lib/session/shopSession.server";
import createClient from "../utils/supabase/server";
import * as React from "react";
import { PriceForm, type PriceFormValues } from "../components/pricebuilder/PriceForm";
import { EditDrawer } from "../components/pricebuilder/EditDrawer";
import {Database} from "../../supabase/database.types";

type VariantRow = {
  variantGID: string;
  productGID: string;
  productName: string | null;
  variantName: string | null;
  category: string | null;
  currentPrice: number | null;
  cogsFromCatalog?: number | null;
};

type ExistingPricing = {
  cogs: number | null;
  profitMarkup: number | null;
  allowanceDiscounts: number | null;
  allowanceShrink: number | null;
  allowanceFinancing: number | null;
  allowanceShipping: number | null;
  marketAdjustment: number | null;
  effectivePrice: number | null;
  currency: string | null;
  source: string | null;
  notes: string | null;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session, headers } = await getShopSession(request);
  const { variantGID } = params;
  if (!variantGID) throw new Response("Missing variantGID", { status: 400 });

  const supabase = createClient();

  const { data: vData, error: vErr } = await supabase
    .from("v_pricebuilder_variants")
    .select("*")
    .eq("shops", session.shopsID as number)
    .eq("variantGID", variantGID)
    .limit(1)
    .maybeSingle();

  if (vErr) throw vErr;
  if (!vData) throw new Response("Variant not found", { status: 404 });

  const variant: VariantRow = {
    variantGID: vData.variantGID,
    productGID: vData.productGID,
    productName: vData.productName,
    variantName: vData.variantName,
    category: vData.category,
    currentPrice: vData.currentPrice,
    cogsFromCatalog: null,
  };

  const { data: pData, error: pErr } = await supabase
    .from("variantPricing")
    .select(
      "cogs, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceFinancing, allowanceShipping, marketAdjustment, effectivePrice, currency, source, notes"
    )
    .eq("shops", session.shopsID as number)
    .eq("variantGID", variant.variantGID)
    .limit(1)
    .maybeSingle();

  if (pErr) throw pErr;

  const existing: ExistingPricing | null = pData ?? null;

  return json(
    {
      variant,
      existing,
      seed: {
        cogs: pData?.cogs ?? variant.cogsFromCatalog ?? 0,
        profitMarkup: pData?.profitMarkup ?? 0,
        allowanceDiscounts: pData?.allowanceDiscounts ?? 0,
        allowanceShrink: pData?.allowanceShrink ?? 0,
        allowanceFinancing: pData?.allowanceFinancing ?? 0,
        allowanceShipping: pData?.allowanceShipping ?? 0,
        marketAdjustment: pData?.marketAdjustment ?? 0,
      },
      currentPrice: variant.currentPrice ?? 0,
    },
    { headers }
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, headers } = await getShopSession(request);
  const form = await request.formData();
  const payload = JSON.parse(String(form.get("payload") || "[]"));

  const supabase = createClient();
  const { data, error } = await supabase.rpc("upsert_variant_pricing", {
    p_shops_id: session.shopsID,
    p_rows: payload,
  });

  if (error) {
    return json({ ok: false, error: error.message }, { headers, status: 400 });
  }
  return json({ ok: true, affected: data?.[0]?.affected ?? 0 }, { headers });
}

function toNum(v?: string | number | null) {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function SingleVariantEditor() {
  const { variant, existing, seed, currentPrice } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Centralized controlled form state for the page
  const [form, setForm] = React.useState<PriceFormValues>({
    cogs: String(seed.cogs ?? 0),
    profitMarkup: String(seed.profitMarkup ?? 0),
    allowanceDiscounts: String(seed.allowanceDiscounts ?? 0),
    allowanceShrink: String(seed.allowanceShrink ?? 0),
    allowanceFinancing: String(seed.allowanceFinancing ?? 0),
    allowanceShipping: String(seed.allowanceShipping ?? 0),
    marketAdjustment: String(seed.marketAdjustment ?? 0),
    notes: existing?.notes ?? "",
  });

  // Live computed selling price (sum of all money fields)
  const sellingPrice = React.useMemo(() => {
    return Number((
      toNum(form.cogs) +
      toNum(form.profitMarkup) +
      toNum(form.allowanceDiscounts) +
      toNum(form.allowanceShrink) +
      toNum(form.allowanceFinancing) +
      toNum(form.allowanceShipping) +
      toNum(form.marketAdjustment)
    ).toFixed(2));
  }, [form]);

  const onSave = () => {
    const payload = [
      {
        variantsGID: variant.variantsGID,
        productsGID: variant.productsGID,
        cogs: toNum(form.cogs),
        profitMarkup: toNum(form.profitMarkup),
        allowanceDiscounts: toNum(form.allowanceDiscounts),
        allowanceShrink: toNum(form.allowanceShrink),
        allowanceFinancing: toNum(form.allowanceFinancing),
        allowanceShipping: toNum(form.allowanceShipping),
        marketAdjustment: toNum(form.marketAdjustment),
        effectivePrice: sellingPrice,
        currency: "USD",
        source: "manual",
        notes: form.notes ?? "",
        updatedBy: "pricebuilder",
      },
    ];

    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    fetcher.submit(fd, { method: "post" });
  };

  return (
    <Page
      title="Price Builder – Single Variant"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      subtitle={`${variant.productTitle ?? ""} – ${variant.variantTitle ?? ""}`}
      secondaryActions={[{ content: "View Product", onAction: () => {} }]}
    >
      <TitleBar title="Single Variant Editor" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              {/* Header facts */}
              <InlineStack gap="400" wrap={false}>
                <Text as="p" variant="headingMd">
                  {variant.productTitle} / {variant.variantTitle}
                </Text>
                {variant.category && <Badge>{variant.category}</Badge>}
              </InlineStack>

              <InlineStack gap="400">
                <Text as="span" tone="subdued">Variant GID: {variant.variantsGID}</Text>
                <Text as="span" tone="subdued">Product GID: {variant.productsGID}</Text>
              </InlineStack>

              {/* Current price banner */}
              <Banner tone="info">
                Current Store Price: <b>${(currentPrice ?? 0).toFixed(2)}</b>
              </Banner>

              <Divider />

              {/* Shared pricing form */}
              <PriceForm
                values={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                sellingPrice={sellingPrice}
                showPercents
              />

              <InlineStack gap="200" align="end">
                <Button onClick={() => navigate(-1)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={fetcher.state !== "idle"}
                  onClick={onSave}
                >
                  Save Pricing
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
