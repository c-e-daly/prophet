// app/routes/app.pricebuilder.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Button, InlineStack, BlockStack, Text, Divider, Banner, TextField } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { requireShopSession } from "../lib/session/shopAuth.server";
import createClient from "../../supabase/server";
import * as React from "react";

type VariantRow = {
  id: number;
  productVariantGID: string;
  productVariantID: string;
  productName: string | null;
  variantName: string | null;
  currentPrice: number | null;
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

type PriceFormValues = {
  cogs: string;
  profitMarkup: string;
  allowanceDiscounts: string;
  allowanceShrink: string;
  allowanceFinancing: string;
  allowanceShipping: string;
  marketAdjustment: string;
  notes?: string;
};

type PriceFormProps = {
  values: PriceFormValues;
  onChange: (patch: Partial<PriceFormValues>) => void;
  currentPrice?: number;
  sellingPrice: number;
  showPercents?: boolean;
};

type LoaderData = {
  variant: VariantRow | null;
  existing: ExistingPricing | null;
  currentPrice: number | null;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { headers } = await requireShopSession(request);
  const supabase = createClient();
  const raw = params.id ?? "";
  const variantNumericId = Number(raw);
  if (!Number.isFinite(variantNumericId)) {
    throw new Response("Invalid variant id", { status: 400 });
  }
  const paramsid = variantNumericId;

  // Variant (no category join)
  const { data: vRows, error: vErr } = await supabase
    .from("variants")
    .select(`
      id,
      productVariantGID,
      productVariantID,
      products ( productName )
    `)
    .eq("id", paramsid)
    .limit(1);

  if (vErr) {
    console.warn("variants query error:", vErr);
  }

  // Latest pricing for this variant (filter by variant, not id)
  const { data: priceRows, error: pErr } = await supabase
    .from("variantPricing")
    .select("cogs, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceShipping, allowanceFinancing, marketAdjustment, effectivePrice, currency, source, notes, publishedDate")
    .eq("variant", paramsid)
    .order("publishedDate", { ascending: false })
    .limit(1);

  if (pErr) console.warn("variantPricing error:", pErr);
  const existing = (priceRows?.[0] ?? null) as ExistingPricing | null;

  const variant = vRows?.[0]
    ? ({
      id: vRows[0].id,
      productVariantGID: vRows[0].productVariantGID,
      productVariantID: vRows[0].productVariantID,
      productName: (vRows[0] as any)?.products?.productName || null,
      variantName: null, // fetch if you store it on variants; left null if not synced
      currentPrice: null, // populate if you fetch from Shopify/storefront
    } as VariantRow)
    : null;

  return json<LoaderData>(
    { variant, existing, currentPrice: variant?.currentPrice || null },
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

function pct(part: number, whole: number) {
  if (!whole || whole <= 0) return 0;
  return (part / whole) * 100;
}

function PriceForm({ values, onChange, sellingPrice, showPercents = true }: PriceFormProps) {
  const Row = (label: keyof PriceFormValues) => {
    const amount = toNum(values[label]);
    const share = pct(amount, sellingPrice);
    return (
      <InlineStack align="space-between" blockAlign="center">
        <TextField
          label={label}
          type="number"
          value={values[label] ?? ""}
          onChange={(v) => onChange({ [label]: v })}
          autoComplete="off"
          prefix="$"
          min={0}
          step={0.1}
        />
        {label !== "notes" && (
          <Text tone="subdued" as="span" variant="bodySm">
            {showPercents ? (sellingPrice > 0 ? `(${share.toFixed(2)}%)` : "(—)") : null}
          </Text>
        )}
      </InlineStack>
    );
  };

  const totalAllowancesPlusMarket = (
    toNum(values.allowanceDiscounts) +
    toNum(values.allowanceShrink) +
    toNum(values.allowanceFinancing) +
    toNum(values.allowanceShipping) +
    toNum(values.marketAdjustment)
  ).toFixed(2);

  return (
    <BlockStack gap="300">
      {Row("cogs")}
      {Row("profitMarkup")}
      {Row("allowanceShrink")}
      {Row("allowanceFinancing")}
      {Row("allowanceDiscounts")}
      {Row("allowanceShipping")}
      {Row("marketAdjustment")}

      <Divider />

      <InlineStack align="space-between">
        <Text as="p">
          Total Allowances + Market Adj: <b>${totalAllowancesPlusMarket}</b>
        </Text>
        <Text as="p">
          Selling Price: <b>${sellingPrice.toFixed(2)}</b> (100%)
        </Text>
      </InlineStack>

      <TextField
        label="Notes"
        value={values.notes ?? ""}
        onChange={(v) => onChange({ notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </BlockStack>
  );
}

export default function SingleVariantEditor() {
  const { variant, existing, currentPrice } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  if (!variant) {
    return (
      <Page title="Price Builder – Single Variant">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Variant not found</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const [form, setForm] = React.useState<PriceFormValues>({
    cogs: String(existing?.cogs ?? 0),
    profitMarkup: String(existing?.profitMarkup ?? 0),
    allowanceDiscounts: String(existing?.allowanceDiscounts ?? 0),
    allowanceShrink: String(existing?.allowanceShrink ?? 0),
    allowanceFinancing: String(existing?.allowanceFinancing ?? 0),
    allowanceShipping: String(existing?.allowanceShipping ?? 0),
    marketAdjustment: String(existing?.marketAdjustment ?? 0),
    notes: existing?.notes ?? "",
  });

  const sellingPrice = React.useMemo(() => {
    return Number(
      (
        toNum(form.cogs) +
        toNum(form.profitMarkup) +
        toNum(form.allowanceDiscounts) +
        toNum(form.allowanceShrink) +
        toNum(form.allowanceFinancing) +
        toNum(form.allowanceShipping) +
        toNum(form.marketAdjustment)
      ).toFixed(2)
    );
  }, [form]);

  const onSave = () => {
    const payload = [
      {
        productVariantGID: variant.productVariantGID,
        productVariantID: variant.productVariantID,
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
      subtitle={`${variant.productName ?? ""}${variant.variantName ? " – " + variant.variantName : ""}`}
      secondaryActions={[{ content: "View Product", onAction: () => { } }]}
    >
      <TitleBar title="Single Variant Editor" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack gap="400" wrap={false}>
                <Text as="p" variant="headingMd">
                  {variant.productName}{variant.variantName ? ` / ${variant.variantName}` : ""}
                </Text>
              </InlineStack>

              <InlineStack gap="400">
                <Text as="span" tone="subdued">Variant GID: {variant.productVariantGID}</Text>
                <Text as="span" tone="subdued">Product GID: {variant.productVariantID}</Text>
              </InlineStack>

              <Banner tone="info">
                Current Store Price: <b>${(currentPrice ?? 0).toFixed(2)}</b>
              </Banner>

              <Divider />

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



/*
// app/routes/app.pricebuilder.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Button, InlineStack, BlockStack, Text, Divider, 
  Badge, Banner, TextField } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { requireShopSession } from "../lib/session/shopAuth.server";
import createClient from "../utils/supabase/server";
import * as React from "react";

type VariantRow = {
  id: number;
  productVariantGID: string;
  productVariantID: string;
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

type PriceFormValues = {
  cogs: string;
  profitMarkup: string;
  allowanceDiscounts: string;
  allowanceShrink: string;
  allowanceFinancing: string;
  allowanceShipping: string;
  marketAdjustment: string;
  notes?: string;
};

type PriceFormProps = {
  values: PriceFormValues;
  onChange: (patch: Partial<PriceFormValues>) => void;
  currentPrice?: number;
  sellingPrice: number;
  showPercents?: boolean;
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
  const paramsid = variantNumericId;
  
  const { data: vRows, error: vErr } = await supabase
    .from("variants")
    .select(`
      id,
      productVariantGID,
      productVariantID,
      products ( productName , productID),
      categories ( categoryName )
    `)
    .eq("id", paramsid)
    .limit(1);

  if (vErr) {
    console.warn("variants query error:", vErr);
  }

  const { data: priceRows, error: pErr } = await supabase
    .from("variantPricing")
    .select("cogs, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceShipping, marketAdjustment")
    .eq("id", paramsid)
    .order("publishedDate", { ascending: false })
    .limit(1);

  if (pErr) console.warn("variantPricing error:", pErr);
  const existing = (priceRows?.[0] ?? null) as ExistingPricing | null;

  const variant = vRows?.[0] ? {
    ...vRows[0],
    productName: vRows[0].products?.productName || null,
    category: vRows[0].categories?.categoryName || null,
    currentPrice: null // You might need to fetch this from elsewhere
  } as VariantRow : null;

  return json<LoaderData>(
    { variant, existing, currentPrice: variant?.currentPrice || null },
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

function pct(part: number, whole: number) {
  if (!whole || whole <= 0) return 0;
  return (part / whole) * 100;
}

function PriceForm({ values, onChange, sellingPrice, showPercents = true }: PriceFormProps) {
  const Row = (label: keyof PriceFormValues) => {
    const amount = toNum(values[label]);
    const share = pct(amount, sellingPrice);
    return (
      <InlineStack align="space-between" blockAlign="center">
        <TextField
          label={label}
          type="number"
          value={values[label] ?? ""}
          onChange={(v) => onChange({ [label]: v })}
          autoComplete="off"
          prefix="$"
          min={0}
          step={0.1}
        />
        {label !== "notes" && (
          <Text tone="subdued" as="span" variant="bodySm">
            {showPercents ? (sellingPrice > 0 ? `(${share.toFixed(2)}%)` : "(—)") : null}
          </Text>
        )}
      </InlineStack>
    );
  };

  const totalAllowancesPlusMarket = (
    toNum(values.allowanceDiscounts) +
    toNum(values.allowanceShrink) +
    toNum(values.allowanceFinancing) +
    toNum(values.allowanceShipping) +
    toNum(values.marketAdjustment)
  ).toFixed(2);

  return (
    <BlockStack gap="300">
      {Row("cogs")}
      {Row("profitMarkup")}
      {Row("allowanceShrink")}
      {Row("allowanceFinancing")}
      {Row("allowanceDiscounts")}
      {Row("allowanceShipping")}
      {Row("marketAdjustment")}

      <Divider />

      <InlineStack align="space-between">
        <Text as="p">
          Total Allowances + Market Adj: <b>${totalAllowancesPlusMarket}</b>
        </Text>
        <Text as="p">
          Selling Price: <b>${sellingPrice.toFixed(2)}</b> (100%)
        </Text>
      </InlineStack>

      <TextField
        label="Notes"
        value={values.notes ?? ""}
        onChange={(v) => onChange({ notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </BlockStack>
  );
}

export default function SingleVariantEditor() {
  const { variant, existing, currentPrice } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Early return if no variant data
  if (!variant) {
    return (
      <Page title="Price Builder – Single Variant">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Variant not found</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Centralized controlled form state for the page
  const [form, setForm] = React.useState<PriceFormValues>({
    cogs: String(existing?.cogs ?? 0),
    profitMarkup: String(existing?.profitMarkup ?? 0),
    allowanceDiscounts: String(existing?.allowanceDiscounts ?? 0),
    allowanceShrink: String(existing?.allowanceShrink ?? 0),
    allowanceFinancing: String(existing?.allowanceFinancing ?? 0),
    allowanceShipping: String(existing?.allowanceShipping ?? 0),
    marketAdjustment: String(existing?.marketAdjustment ?? 0),
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
        productVariantGID: variant.productVariantGID,
        productVariantID: variant.productVariantID,
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
            
              <InlineStack gap="400" wrap={false}>
                <Text as="p" variant="headingMd">
                  {variant.productName} / {variant.variantName}
                </Text>
                {variant.category && <Badge>{variant.category}</Badge>}
              </InlineStack>

              <InlineStack gap="400">
                <Text as="span" tone="subdued">Variant GID: {variant.productVariantGID}</Text>
                <Text as="span" tone="subdued">Product GID: {variant.productVariantID}</Text>
              </InlineStack>

            
              <Banner tone="info">
                Current Store Price: <b>${(currentPrice ?? 0).toFixed(2)}</b>
              </Banner>

              <Divider />

       
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

*/