// app/routes/app.pricebuilder.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {  Page, Layout, Card, Button, InlineStack, BlockStack, Text, Divider, Badge, Banner} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { requireShopSession } from "../lib/session/shopAuth.server";
import createClient from "../utils/supabase/server";
import * as React from "react";
import { PriceForm, type PriceFormValues } from "../components/pricebuilder/PriceForm";

type VariantRow = {
  id: number;
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

type LoaderData = {
  variant: VariantRow | null;
  existing: ExistingPricing | null;
  currentPrice: number | null;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireShopSession(request);
  const supabase = createClient();
  const raw = params.id ?? "";
  const variantNumericId = Number(raw);
  if (!Number.isFinite(variantNumericId)) {
    throw new Response("Invalid variant id", { status: 400 });
  }
  const paramsid=variantNumericId;
  
  const { data: vRows, error: vErr } = await supabase
  .from("variants")
  .select(`
    id,
    variantGID,
    productGID,
    products ( productName ),
    categories ( categoryName )
  `)
  .eq("id", paramsid)
  .limit(1);

  if (vErr) {
    console.warn("variants query error:", vErr);
  }

  // Align to real columns in variantPricing (drop/rename allowanceFinancing if it doesn't exist)
  const { data: priceRows, error: pErr } = await supabase
    .from("variantPricing")
    .select("cogs, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceShipping, marketAdjustment")
    .eq("id", paramsid)
    .order("publishedDate", { ascending: false })
    .limit(1);

  if (pErr) console.warn("variantPricing error:", pErr);
  const existing = (priceRows?.[0] ?? null) as ExistingPricing | null;

  if (!variant) {
    return json<LoaderData>(
      { variant: null, existing: null, currentPrice: null, seed: Math.random() },
      { headers: headers as HeadersInit }
    );

}

export async function action({ request }: ActionFunctionArgs) {
  const { shopSession, headers } = await requireShopSession(request);
  const form = await request.formData();
  const payload = JSON.parse(String(form.get("payload") || "[]"));

  const supabase = createClient();
  const { data, error } = await supabase.rpc("upsert_variant_pricing", {
    p_shops_id: shopSession.shopsID,
    p_rows: payload,
  });

  if (error) {
    return json({ ok: false, error: error.message }, { headers, status: 400 });
  }
   return json({ ok: true }, { headers: headers as HeadersInit });
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
        variantGID: variant.variantGID,
        productGID: variant.productGID,
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
      subtitle={`${variant.productName ?? ""} – ${variant.variantName ?? ""}`}
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
                  {variant.productName} / {variant.variantName}
                </Text>
                {variant.category && <Badge>{variant.category}</Badge>}
              </InlineStack>

              <InlineStack gap="400">
                <Text as="span" tone="subdued">Variant GID: {variant.variantGID}</Text>
                <Text as="span" tone="subdued">Product GID: {variant.productGID}</Text>
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
