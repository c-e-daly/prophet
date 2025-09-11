// app/routes/app.pricebuilder.$variantGID.tsx
// --- Imports (session, Polaris, Remix/React) ---
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useParams } from "@remix-run/react";
import {  Page, Layout, Card, TextField, Button, InlineStack, BlockStack, Text, Divider, Badge, Banner
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getShopSession } from "../lib/session/shopSession.server";
import createClient from "../utils/supabase/server";

type VariantRow = {
  variantsGID: string;
  productsGID: string;
  productTitle: string | null;
  variantTitle: string | null;
  category: string | null;
  currentPrice: number | null;
  cogsFromCatalog?: number | null; // if you store cogs in catalog somewhere
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

  // Pull catalog info (join your view as needed)
  const { data: vData, error: vErr } = await supabase
    .from("v_pricebuilder_variants")
    .select("*")
    .eq("shopsID", session.shopsID as number)
    .eq("variantsGID", variantGID)
    .limit(1)
    .maybeSingle();

  if (vErr) throw vErr;
  if (!vData) throw new Response("Variant not found", { status: 404 });

  const variant: VariantRow = {
    variantsGID: vData.variantsGID,
    productsGID: vData.productsGID,
    productTitle: vData.productTitle,
    variantTitle: vData.variantTitle,
    category: vData.category,
    currentPrice: vData.currentPrice,
    cogsFromCatalog: null, // set if you have it
  };

  // Pull existing pricing (if any)
  const { data: pData, error: pErr } = await supabase
    .from("variantPricing")
    .select(
      "cogs, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceFinancing, allowanceShipping, marketAdjustment, effectivePrice, currency, source, notes"
    )
    .eq("shopsID", session.shopsID as number)
    .eq("variantsGID", variant.variantsGID)
    .limit(1)
    .maybeSingle();

  if (pErr) throw pErr;

  const existing: ExistingPricing | null = pData ?? null;

  return json(
    {
      variant,
      existing,
      // default COGS seed: prefer stored pricing.cogs, else catalog cogs, else 0
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

// --- Utils (client) ---
function toNum(v: string | number | null | undefined): number {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function sum(...nums: number[]) {
  return nums.reduce((t, n) => t + (Number.isFinite(n) ? n : 0), 0);
}
function pct(part: number, whole: number) {
  if (!whole || whole <= 0) return 0;
  return (part / whole) * 100;
}

export default function SingleVariantEditor() {
  const { variant, existing, seed, currentPrice } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // form state
  const [cogs, setCogs] = React.useState(String(seed.cogs ?? 0));
  const [profitMarkup, setProfitMarkup] = React.useState(
    String(seed.profitMarkup ?? 0)
  );
  const [aDisc, setADisc] = React.useState(
    String(seed.allowanceDiscounts ?? 0)
  );
  const [aShrink, setAShrink] = React.useState(
    String(seed.allowanceShrink ?? 0)
  );
  const [aFin, setAFin] = React.useState(
    String(seed.allowanceFinancing ?? 0)
  );
  const [aShip, setAShip] = React.useState(
    String(seed.allowanceShipping ?? 0)
  );
  const [mAdj, setMAdj] = React.useState(String(seed.marketAdjustment ?? 0));
  const [notes, setNotes] = React.useState(existing?.notes ?? "");

  // live price
  const sellingPrice = React.useMemo(() => {
    return Number(
      sum(
        toNum(cogs),
        toNum(profitMarkup),
        toNum(aDisc),
        toNum(aShrink),
        toNum(aFin),
        toNum(aShip),
        toNum(mAdj)
      ).toFixed(2)
    );
  }, [cogs, profitMarkup, aDisc, aShrink, aFin, aShip, mAdj]);

  const totalAllowancesPlusMarket = React.useMemo(() => {
    return Number(
      sum(toNum(aDisc), toNum(aShrink), toNum(aFin), toNum(aShip), toNum(mAdj)).toFixed(2)
    );
  }, [aDisc, aShrink, aFin, aShip, mAdj]);

  const onSave = () => {
    const payload = [
      {
        variantsGID: variant.variantsGID,
        productsGID: variant.productsGID,
        cogs: toNum(cogs),
        profitMarkup: toNum(profitMarkup),
        allowanceDiscounts: toNum(aDisc),
        allowanceShrink: toNum(aShrink),
        allowanceFinancing: toNum(aFin),
        allowanceShipping: toNum(aShip),
        marketAdjustment: toNum(mAdj),
        effectivePrice: sellingPrice,
        currency: "USD",
        source: "manual",
        notes,
        updatedBy: "pricebuilder", // replace with session.user if you have it
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
      secondaryActions={[
        { content: "View Product", onAction: () => {} },
      ]}
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
                <Text as="span" tone="subdued">
                  Variant GID: {variant.variantsGID}
                </Text>
                <Text as="span" tone="subdued">
                  Product GID: {variant.productsGID}
                </Text>
              </InlineStack>

              {/* Current price banner */}
              <Banner tone="info">
                Current Store Price: <b>${(currentPrice ?? 0).toFixed(2)}</b>
              </Banner>

              <Divider />

              {/* Inputs with live % of sellingPrice */}
              <BlockStack gap="300">
                <RowMoney
                  label="COGS"
                  value={cogs}
                  onChange={setCogs}
                  pctOf={sellingPrice}
                />
                <RowMoney
                  label="profitMarkup"
                  value={profitMarkup}
                  onChange={setProfitMarkup}
                  pctOf={sellingPrice}
                />
                <RowMoney
                  label="allowanceShrink"
                  value={aShrink}
                  onChange={setAShrink}
                  pctOf={sellingPrice}
                />
                <RowMoney
                  label="allowanceFinancing"
                  value={aFin}
                  onChange={setAFin}
                  pctOf={sellingPrice}
                />
                <RowMoney
                  label="allowanceDiscounts"
                  value={aDisc}
                  onChange={setADisc}
                  pctOf={sellingPrice}
                />
                <RowMoney
                  label="allowanceShipping"
                  value={aShip}
                  onChange={setAShip}
                  pctOf={sellingPrice}
                />
                <RowMoney
                  label="marketAdjustment"
                  value={mAdj}
                  onChange={setMAdj}
                  pctOf={sellingPrice}
                />
              </BlockStack>

              <Divider />

              {/* Totals & Selling Price */}
              <InlineStack align="space-between">
                <Text as="p">
                  Total Allowances + Market Adj: <b>${totalAllowancesPlusMarket.toFixed(2)}</b>
                </Text>
                <Text as="p">
                  Selling Price: <b>${sellingPrice.toFixed(2)}</b> (100%)
                </Text>
              </InlineStack>

              <TextField
                label="Notes"
                value={notes}
                onChange={setNotes}
                autoComplete="off"
                multiline={3}
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

// Small helper “row” for money + % of sellingPrice
function RowMoney({
  label,
  value,
  onChange,
  pctOf,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  pctOf: number;
}) {
  const amount = toNum(value);
  const share = pct(amount, pctOf);

  return (
    <InlineStack align="space-between" blockAlign="center">
      <TextField
        label={label}
        type="number"
        value={value}
        onChange={onChange}
        autoComplete="off"
        prefix="$"
        min="0"
        step="0.01"
      />
      <Text tone="subdued" as="span" variant="bodySm">
        {pctOf > 0 ? `(${share.toFixed(2)}%)` : "(—)"}
      </Text>
    </InlineStack>
  );
}
