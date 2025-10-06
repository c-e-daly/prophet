// app/routes/app.pricebuilder.bulkeditor.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Button, InlineStack, BlockStack, Text, Divider,
  Banner, TextField, Tooltip, Icon, DataTable, Badge} from "@shopify/polaris";
import { QuestionCircleIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import * as React from "react";
import { authenticate } from "../shopify.server";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";
import { savePricingDraft, publishAndMarkPricing } from "../lib/queries/supabase/upsertShopSavedPrices";
import createClient from "../../supabase/server";
import { formatCurrencyUSD } from "../utils/format";

type VariantData = {
  id: number;
  variantGID: string | null;
  variantID: string | null;
  productID: string | null;
  itemCost: number | null;
  shopifyPrice: number | null;
  pricing: number | null;
  shops: number | null;
  name: string | null;
  variantSKU: string | null;
  products: number | null;
  inventoryLevel: number | null;
  productName?: string | null;
};

type LoaderData = {
  variants: VariantData[];
};

type ActionData = {
  ok: boolean;
  action?: string;
  message?: string;
  error?: string;
};

type PriceFormValues = {
  markupPercent: string;
  allowanceDiscounts: string;
  allowanceShrink: string;
  allowanceFinance: string;
  allowanceShipping: string;
  marketAdjustment: string;
  notes: string;
};

const FIELD_TOOLTIPS = {
  markupPercent: "Markup percentage above cost (e.g., 200% means 3x the cost)",
  allowanceShrink: "Reserve for inventory shrinkage, damage, or loss (% of selling price)",
  allowanceFinance: "Cost of financing or payment processing fees (% of selling price)",
  allowanceDiscounts: "Expected promotional discount allocation (% of selling price)",
  allowanceShipping: "Shipping and fulfillment cost buffer (% of selling price)",
  marketAdjustment: "Competitive pricing adjustment in dollars (+/-)"
};

// ============ ACTION: Store variant IDs in Shopify session ============
// app/routes/app.pricebuilder.bulkedit.tsx

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action") as string;
  console.log("[BulkEdit action] form _action =", actionType);


  console.log("Action type:", actionType); // Debug log

  // FIRST: Handle storing the selection
  if (actionType === "store_selection") {
    const variantIdsJson = formData.get("variantIds") as string;
    
    if (!variantIdsJson) {
      return json({ ok: false, error: "No variant IDs provided" }, { status: 400 });
    }
    
    const variantIds = JSON.parse(variantIdsJson) as number[];
    
    console.log("Storing variant IDs:", variantIds); // Debug log
 
    
    // Store in session
    (session as any).bulkEditVariantIds = variantIds;
    const { sessionStorage } = await import("../shopify.server");
    await sessionStorage.storeSession(session);
    
    // Redirect to bulkedit page
    return redirect("/app/pricebuilder/bulkeditor");
  }

  // SECOND: Handle save/publish (only runs when on the bulkedit page)
  const { shopsID, currentUserId, currentUserEmail } = await requireAuthContext(request);
  
  if (actionType === "save" || actionType === "publish") {
    const payloadJson = formData.get("payload") as string;
    
    if (!payloadJson) {
      return json({ ok: false, error: "No payload provided" }, { status: 400 });
    }
    
    const payload = JSON.parse(payloadJson);
    const results = [];

    for (const variantData of payload.variants) {
      const input = {
        shopsID,
        variantId: variantData.variantId,
        variantGID: variantData.variantGID,
        variantID: variantData.variantID,
        productID: variantData.productID,
        itemCost: variantData.itemCost,
        profitMarkup: variantData.profitMarkup,
        allowanceDiscounts: variantData.allowanceDiscounts,
        allowanceShrink: variantData.allowanceShrink,
        allowanceFinance: variantData.allowanceFinance,
        allowanceShipping: variantData.allowanceShipping,
        marketAdjustment: variantData.marketAdjustment,
        builderPrice: variantData.builderPrice,
        notes: variantData.notes,
        userId: currentUserId,
        userEmail: currentUserEmail,
      };

      if (actionType === "save") {
        const result = await savePricingDraft(input);
        results.push(result);
      } else {
        const result = await publishAndMarkPricing(request, input);
        results.push(result);
      }
    }

    const allSuccess = results.every(r => r.success);
    const successCount = results.filter(r => r.success).length;

    return json<ActionData>({
      ok: allSuccess,
      action: actionType,
      message: allSuccess 
        ? `Successfully ${actionType === "save" ? "saved" : "published"} ${successCount} variants` 
        : `${successCount} of ${results.length} variants ${actionType === "save" ? "saved" : "published"}`,
      error: allSuccess ? undefined : "Some variants failed to process",
    });
  }

  return json({ ok: false, error: "Unknown action" }, { status: 400 });
}

/*
export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const { shopsID, currentUserId, currentUserEmail } = await requireAuthContext(request);
  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  // Store selection in Shopify session (custom data)
  if (actionType === "store_selection") {
    const variantIdsJson = formData.get("variantIds") as string;
    const variantIds = JSON.parse(variantIdsJson) as number[];
    
    (session as any).bulkEditVariantIds = variantIds;
    const { sessionStorage } = await import("../shopify.server");
    await sessionStorage.storeSession(session);
    
    return json({ success: true });
  }

  // Bulk save or publish
  if (actionType === "save" || actionType === "publish") {
    const payload = JSON.parse(formData.get("payload") as string);
    const results = [];

    for (const variantData of payload.variants) {
      const input = {
        shopsID,
        variantId: variantData.variantId,
        variantGID: variantData.variantGID,
        variantID: variantData.variantID,
        productID: variantData.productID,
        itemCost: variantData.itemCost,
        profitMarkup: variantData.profitMarkup,
        allowanceDiscounts: variantData.allowanceDiscounts,
        allowanceShrink: variantData.allowanceShrink,
        allowanceFinance: variantData.allowanceFinance,
        allowanceShipping: variantData.allowanceShipping,
        marketAdjustment: variantData.marketAdjustment,
        builderPrice: variantData.builderPrice,
        notes: variantData.notes,
        userId: currentUserId,
        userEmail: currentUserEmail,
      };

      if (actionType === "save") {
        const result = await savePricingDraft(input);
        results.push(result);
      } else {
        const result = await publishAndMarkPricing(request, input);
        results.push(result);
      }
    }

    const allSuccess = results.every(r => r.success);
    const successCount = results.filter(r => r.success).length;

    return json<ActionData>({
      ok: allSuccess,
      action: actionType,
      message: allSuccess 
        ? `Successfully ${actionType === "save" ? "saved" : "published"} ${successCount} variants` 
        : `${successCount} of ${results.length} variants ${actionType === "save" ? "saved" : "published"}`,
      error: allSuccess ? undefined : "Some variants failed to process",
    });
  }

  return json<ActionData>({ ok: false, error: "Unknown action" });
}
*/
// ============ LOADER: Get variants from Shopify session ============
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shopsID } = await getAuthContext(request);
  
  // Retrieve from Shopify session custom data
  const variantIds = (session as any).bulkEditVariantIds as number[] | undefined;

  if (!variantIds || variantIds.length === 0) {
    return redirect("/app/pricebuilder");
  }

  const supabase = createClient();

  // Fetch all selected variants with product info
  const { data: variants, error } = await supabase
    .from("variants")
    .select(`
      id, 
      variantGID, 
      variantID, 
      productID, 
      itemCost, 
      shopifyPrice, 
      pricing, 
      shops, 
      name, 
      variantSKU, 
      products, 
      inventoryLevel,
      products!inner(name)
    `)
    .eq("shops", shopsID)
    .in("id", variantIds);

  if (error) {
    console.error("Error fetching variants:", error);
    return redirect("/app/pricebuilder");
  }

  // Flatten product name
  const flatVariants = (variants || []).map(v => ({
    ...v,
    productName: v.products?.name || null,
  }));

  // Clear session data after loading
  delete (session as any).bulkEditVariantIds;
  const { sessionStorage } = await import("../shopify.server");
  await sessionStorage.storeSession(session);

  return json<LoaderData>({ variants: flatVariants });
}

// ============ HELPER FUNCTIONS ============
function toNum(v?: string | number | null) {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function centsToD(cents: number) {
  return cents / 100;
}

function calculateSellingPrice(
  costCents: number,
  markupPercent: number,
  allowanceDiscounts: number,
  allowanceShrink: number,
  allowanceFinance: number,
  allowanceShipping: number,
  marketAdjustmentCents: number
) {
  const cost = centsToD(costCents);
  const markupMultiplier = 1 + (markupPercent / 100);
  const targetProfit = cost * markupMultiplier;
  
  const totalAllowancePercent = 
    allowanceDiscounts + 
    allowanceShrink + 
    allowanceFinance + 
    allowanceShipping;
  
  const sellingPrice = targetProfit / (1 - (totalAllowancePercent / 100));
  const marketAdj = centsToD(marketAdjustmentCents);
  
  return sellingPrice + marketAdj;
}

function calculatePriceBreakdown(
  costCents: number,
  markupPercent: number,
  allowanceDiscounts: number,
  allowanceShrink: number,
  allowanceFinance: number,
  allowanceShipping: number,
  marketAdjustmentCents: number
) {
  const sellingPrice = calculateSellingPrice(
    costCents,
    markupPercent,
    allowanceDiscounts,
    allowanceShrink,
    allowanceFinance,
    allowanceShipping,
    marketAdjustmentCents
  );
  
  const cost = centsToD(costCents);
  const marketAdj = centsToD(marketAdjustmentCents);
  
  const shrinkDollars = sellingPrice * (allowanceShrink / 100);
  const financeDollars = sellingPrice * (allowanceFinance / 100);
  const discountDollars = sellingPrice * (allowanceDiscounts / 100);
  const shippingDollars = sellingPrice * (allowanceShipping / 100);
  const totalAllowancesDollars = shrinkDollars + financeDollars + discountDollars + shippingDollars;
  
  const profitMarkup = sellingPrice - cost - totalAllowancesDollars - marketAdj;
  
  return {
    cost,
    profitMarkup,
    shrinkDollars,
    financeDollars,
    discountDollars,
    shippingDollars,
    totalAllowancesDollars,
    marketAdj,
    sellingPrice,
  };
}

// ============ PRICE FORM COMPONENT ============
function PriceForm({ 
  values, 
  onChange 
}: { 
  values: PriceFormValues; 
  onChange: (patch: Partial<PriceFormValues>) => void;
}) {
  return (
    <BlockStack gap="400">
      <Text as="h3" variant="headingSm">Markup</Text>
      <InlineStack gap="100" blockAlign="center">
        <TextField
          label="Profit Markup %"
          type="number"
          value={values.markupPercent}
          onChange={(v) => onChange({ markupPercent: v })}
          autoComplete="off"
          suffix="%"
          min={0}
          step={1}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Tooltip content={FIELD_TOOLTIPS.markupPercent}>
            <Icon source={QuestionCircleIcon} tone="base" />
          </Tooltip>
        </div>
      </InlineStack>
      
      <Divider />
      
      <Text as="h3" variant="headingSm">Allowances (% of Selling Price)</Text>
      
      <InlineStack gap="100" blockAlign="center">
        <TextField
          label="Allowance: Shrink"
          type="number"
          value={values.allowanceShrink}
          onChange={(v) => onChange({ allowanceShrink: v })}
          autoComplete="off"
          suffix="%"
          min={0}
          step={0.1}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Tooltip content={FIELD_TOOLTIPS.allowanceShrink}>
            <Icon source={QuestionCircleIcon} tone="base" />
          </Tooltip>
        </div>
      </InlineStack>
      
      <InlineStack gap="100" blockAlign="center">
        <TextField
          label="Allowance: Finance"
          type="number"
          value={values.allowanceFinance}
          onChange={(v) => onChange({ allowanceFinance: v })}
          autoComplete="off"
          suffix="%"
          min={0}
          step={0.1}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Tooltip content={FIELD_TOOLTIPS.allowanceFinance}>
            <Icon source={QuestionCircleIcon} tone="base" />
          </Tooltip>
        </div>
      </InlineStack>
      
      <InlineStack gap="100" blockAlign="center">
        <TextField
          label="Allowance: Discounts"
          type="number"
          value={values.allowanceDiscounts}
          onChange={(v) => onChange({ allowanceDiscounts: v })}
          autoComplete="off"
          suffix="%"
          min={0}
          step={0.1}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Tooltip content={FIELD_TOOLTIPS.allowanceDiscounts}>
            <Icon source={QuestionCircleIcon} tone="base" />
          </Tooltip>
        </div>
      </InlineStack>
      
      <InlineStack gap="100" blockAlign="center">
        <TextField
          label="Allowance: Shipping"
          type="number"
          value={values.allowanceShipping}
          onChange={(v) => onChange({ allowanceShipping: v })}
          autoComplete="off"
          suffix="%"
          min={0}
          step={0.1}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Tooltip content={FIELD_TOOLTIPS.allowanceShipping}>
            <Icon source={QuestionCircleIcon} tone="base" />
          </Tooltip>
        </div>
      </InlineStack>
      
      <Divider />
      
      <Text as="h3" variant="headingSm">Market Adjustment</Text>
      <InlineStack gap="100" blockAlign="center">
        <TextField
          label="Market Adjustment ($)"
          type="number"
          value={values.marketAdjustment}
          onChange={(v) => onChange({ marketAdjustment: v })}
          autoComplete="off"
          prefix="$"
          step={0.01}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Tooltip content={FIELD_TOOLTIPS.marketAdjustment}>
            <Icon source={QuestionCircleIcon} tone="base" />
          </Tooltip>
        </div>
      </InlineStack>

      <TextField
        label="Internal Notes (applied to all variants)"
        value={values.notes}
        onChange={(v) => onChange({ notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </BlockStack>
  );
}

// ============ MAIN COMPONENT ============
export default function BulkPriceEditor() {
  const { variants } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (fetcher.data?.ok) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [fetcher.data]);

  const [form, setForm] = React.useState<PriceFormValues>({
    markupPercent: "200",
    allowanceDiscounts: "20",
    allowanceShrink: "2",
    allowanceFinance: "2",
    allowanceShipping: "8",
    marketAdjustment: "0",
    notes: "",
  });

  const variantsWithPrices = React.useMemo(() => {
    return variants.map(variant => {
      const breakdown = calculatePriceBreakdown(
        variant.itemCost || 0,
        toNum(form.markupPercent),
        toNum(form.allowanceDiscounts),
        toNum(form.allowanceShrink),
        toNum(form.allowanceFinance),
        toNum(form.allowanceShipping),
        Math.round(toNum(form.marketAdjustment) * 100)
      );

      const currentPrice = centsToD(variant.shopifyPrice || 0);
      const priceDiff = breakdown.sellingPrice - currentPrice;
      const priceDiffPercent = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

      return {
        ...variant,
        currentPrice,
        newPrice: breakdown.sellingPrice,
        priceDiff,
        priceDiffPercent,
        breakdown,
      };
    });
  }, [variants, form]);

  const onSave = (action: "save" | "publish") => {
    const variantsPayload = variantsWithPrices.map(v => ({
      variantId: v.id,
      variantGID: v.variantGID || "",
      variantID: v.variantID || "",
      productID: v.productID || "",
      itemCost: v.itemCost || 0,
      profitMarkup: Math.round(v.breakdown.profitMarkup * 100),
      allowanceDiscounts: Math.round(v.breakdown.discountDollars * 100),
      allowanceShrink: Math.round(v.breakdown.shrinkDollars * 100),
      allowanceFinance: Math.round(v.breakdown.financeDollars * 100),
      allowanceShipping: Math.round(v.breakdown.shippingDollars * 100),
      marketAdjustment: Math.round(v.breakdown.marketAdj * 100),
      builderPrice: Math.round(v.breakdown.sellingPrice * 100),
      notes: form.notes,
    }));

    const fd = new FormData();
    fd.append("_action", action);
    fd.append("payload", JSON.stringify({ variants: variantsPayload }));
    fetcher.submit(fd, { method: "post" });
  };

  const totalCurrentRevenue = variantsWithPrices.reduce((sum, v) => sum + (v.currentPrice * (v.inventoryLevel || 0)), 0);
  const totalNewRevenue = variantsWithPrices.reduce((sum, v) => sum + (v.newPrice * (v.inventoryLevel || 0)), 0);
  const revenueIncrease = totalNewRevenue - totalCurrentRevenue;

  const tableRows = variantsWithPrices.map(v => [
    <Text as="span" variant="bodySm">{v.productName || "—"}</Text>,
    <Text as="span" variant="bodySm">{v.name || "—"}</Text>,
    <Text as="span" variant="bodySm">{v.variantSKU || "—"}</Text>,
    <Text as="span">{formatCurrencyUSD(v.itemCost || 0)}</Text>,
    <Text as="span">{formatCurrencyUSD(Math.round(v.currentPrice * 100))}</Text>,
    <Text as="span" fontWeight="semibold">{formatCurrencyUSD(Math.round(v.newPrice * 100))}</Text>,
    <Badge tone={v.priceDiff >= 0 ? "success" : "critical"}>
      {`${v.priceDiff >= 0 ? "+" : ""}${v.priceDiffPercent.toFixed(1)}%`}
    </Badge>,
  ]);

  return (
    <Page
      title="Bulk Price Editor"
      backAction={{ content: "Price Builder", url: "/app/pricebuilder" }}
      subtitle={`Editing ${variants.length} variants`}
    >
      <TitleBar title="Bulk Price Editor" />
      
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {showSuccess && (
              <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
                {fetcher.data?.message || "Pricing updated successfully"}
              </Banner>
            )}

            {fetcher.data?.ok === false && (
              <Banner tone="critical">{fetcher.data.error}</Banner>
            )}

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">Selected Variants</Text>
                <Text as="p" tone="subdued">
                  The same pricing formula will be applied to all {variants.length} variants below.
                  Each variant's new price is calculated based on its individual cost.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'numeric', 'text']}
                headings={[
                  'Product',
                  'Variant',
                  'SKU',
                  'Cost',
                  'Current Price',
                  'New Price',
                  'Change',
                ]}
                rows={tableRows}
                footerContent={
                  <div style={{ padding: "1rem", background: "#f6f6f7" }}>
                    <InlineStack align="space-between">
                      <Text as="span" fontWeight="semibold">Total Expected Revenue Increase:</Text>
                      <Text 
                        as="span" 
                        variant="headingMd" 
                        fontWeight="bold"
                        tone={revenueIncrease >= 0 ? "success" : "critical"}
                      >
                        {revenueIncrease >= 0 ? "+" : ""}{formatCurrencyUSD(Math.round(Math.abs(revenueIncrease) * 100))}
                      </Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Based on current inventory levels
                    </Text>
                  </div>
                }
              />
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Pricing Formula</Text>
                <PriceForm
                  values={form}
                  onChange={(patch) => setForm(f => ({ ...f, ...patch }))}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Actions</Text>
                <BlockStack gap="200">
                  <Button
                    variant="primary"
                    loading={fetcher.state !== "idle" && fetcher.formData?.get("_action") === "save"}
                    onClick={() => onSave("save")}
                    fullWidth
                  >
                    Save All Pricing
                  </Button>
                  <Button
                    tone="success"
                    loading={fetcher.state !== "idle" && fetcher.formData?.get("_action") === "publish"}
                    onClick={() => onSave("publish")}
                    fullWidth
                  >
                    Publish All to Shopify
                  </Button>
                  <Button onClick={() => navigate("/app/pricebuilder")} fullWidth>
                    Cancel
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Formula Summary</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Allowances: {(
                    toNum(form.allowanceDiscounts) + 
                    toNum(form.allowanceShrink) + 
                    toNum(form.allowanceFinance) + 
                    toNum(form.allowanceShipping)
                  ).toFixed(1)}%
                </Text>
                <Divider />
                <Text as="p" variant="bodySm" tone="subdued">
                  Formula: (Cost × {(1 + toNum(form.markupPercent) / 100).toFixed(2)}) / (1 - {(
                    toNum(form.allowanceDiscounts) + 
                    toNum(form.allowanceShrink) + 
                    toNum(form.allowanceFinance) + 
                    toNum(form.allowanceShipping)
                  ) / 100}) + Market Adj.
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}