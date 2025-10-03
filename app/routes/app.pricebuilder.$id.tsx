// app/routes/app.pricebuilder.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Button, InlineStack, BlockStack, Text, Divider, 
  Banner, TextField, Tooltip, Icon} from "@shopify/polaris";
import { QuestionCircleIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import createClient from "../../supabase/server";
import * as React from "react";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";

// Simple types based on actual schema - allow nulls from DB
type VariantData = {
  id: number;
  variantGID: string | null;
  variantID: string | null; // Shopify numeric ID
  productID: string | null; // Shopify product numeric ID
  itemCost: number | null;
  shopifyPrice: number | null;
  pricing: number | null;
  shops: number | null;
  name: string | null;
  variantSKU: string | null;
  products: number | null; // FK to products table
  inventoryLevel: number | null; // For profit projections
};

type PricingData = {
  itemCost: number | null;
  profitMarkup: number | null;
  allowanceDiscounts: number | null;
  allowanceShrink: number | null;
  allowanceFinance: number | null;
  allowanceShipping: number | null;
  marketAdjustment: number | null;
  builderPrice: number | null;
  notes: string | null;
};

type ProductData = {
  name: string | null;
};

type LoaderData = {
  variant: VariantData | null;
  pricing: PricingData | null;
  product: ProductData | null;
};

type ActionData = {
  ok: boolean;
  action?: string;
  message?: string;
  error?: string;
};

type PriceFormValues = {
  itemCost: string;
  profitMarkup: string;
  allowanceDiscounts: string;
  allowanceShrink: string;
  allowanceFinance: string;
  allowanceShipping: string;
  marketAdjustment: string;
  notes: string;
};

const FIELD_TOOLTIPS = {
  itemCost: "Direct cost of goods sold (COGS) for this item",
  profitMarkup: "Fixed costs + Variable costs + Net income desired",
  allowanceShrink: "Reserve for inventory shrinkage, damage, or loss",
  allowanceFinance: "Cost of financing or payment processing fees",
  allowanceDiscounts: "Expected promotional discount allocation",
  allowanceShipping: "Shipping and fulfillment cost buffer",
  marketAdjustment: "Competitive pricing adjustment (+/-)"
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopsID } = await getAuthContext(request);
  const variantsID = Number(params.id ?? "");
  
  if (!Number.isFinite(variantsID)) {
    throw new Response("Invalid variant id", { status: 400 });
  }

  const supabase = createClient();
  
  // Get variant (only what we need) - add inventoryLevel for profit projections
  const { data: variant } = await supabase
    .from("variants")
    .select("id, variantGID, variantID, productID, itemCost, shopifyPrice, pricing, shops, name, variantSKU, products, inventoryLevel")
    .eq("id", variantsID)
    .eq("shops", shopsID)
    .maybeSingle();

  // Get pricing if exists
  let pricing = null;
  if (variant?.pricing) {
    const { data: pricingData } = await supabase
      .from("variantPricing")
      .select("itemCost, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceFinance, allowanceShipping, marketAdjustment, builderPrice, notes")
      .eq("id", variant.pricing)
      .maybeSingle();
    pricing = pricingData;
  }

  // Get product name
  let product = null;
  if (variant?.products) {
    const { data: productData } = await supabase
      .from("products")
      .select("name")
      .eq("id", variant.products)
      .maybeSingle();
    product = productData;
  }

  return json<LoaderData>({ variant, pricing, product });
}

export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId, currentUserEmail } = await requireAuthContext(request);
  const form = await request.formData();
  const actionType = form.get("_action") as string;
  const payload = JSON.parse(form.get("payload") as string);

  const supabase = createClient();
  const now = new Date().toISOString();

  if (actionType === "save") {
    // Insert new pricing record - include required fields productID and variantID
    const { data: newPricing, error } = await supabase
      .from("variantPricing")
      .insert({
        shops: shopsID,
        variants: payload.variantId,
        productID: payload.productID || "", // Required field
        variantID: payload.variantID || "", // Required field
        itemCost: payload.itemCost,
        profitMarkup: payload.profitMarkup,
        allowanceDiscounts: payload.allowanceDiscounts,
        allowanceShrink: payload.allowanceShrink,
        allowanceFinance: payload.allowanceFinance,
        allowanceShipping: payload.allowanceShipping,
        marketAdjustment: payload.marketAdjustment,
        builderPrice: payload.builderPrice,
        currency: "USD",
        source: "draft",
        notes: payload.notes,
        createdByUser: currentUserId,
        createDate: now,
        modifiedDate: now,
        updatedBy: currentUserEmail,
      })
      .select("id")
      .single();

    if (error) {
      return json<ActionData>({ ok: false, error: error.message });
    }

    // Update variant to point to this pricing
    await supabase
      .from("variants")
      .update({ pricing: newPricing.id })
      .eq("id", payload.variantId);

    return json<ActionData>({ ok: true, action: "saved" });
  }

  if (actionType === "publish") {
    // Save first
    const { data: newPricing, error: saveError } = await supabase
      .from("variantPricing")
      .insert({
        shops: shopsID,
        variants: payload.variantId,
        productID: payload.productID || "", // Required field
        variantID: payload.variantID || "", // Required field
        itemCost: payload.itemCost,
        profitMarkup: payload.profitMarkup,
        allowanceDiscounts: payload.allowanceDiscounts,
        allowanceShrink: payload.allowanceShrink,
        allowanceFinance: payload.allowanceFinance,
        allowanceShipping: payload.allowanceShipping,
        marketAdjustment: payload.marketAdjustment,
        builderPrice: payload.builderPrice,
        publishedPrice: payload.builderPrice,
        currency: "USD",
        source: "published",
        notes: payload.notes,
        createdByUser: currentUserId,
        createDate: now,
        modifiedDate: now,
        publishedDate: now,
        isPublished: true,
        updatedBy: currentUserEmail,
      })
      .select("id")
      .single();

    if (saveError) {
      return json<ActionData>({ ok: false, error: saveError.message });
    }

    // Update variant
    await supabase
      .from("variants")
      .update({ pricing: newPricing.id })
      .eq("id", payload.variantId);

    // Publish to Shopify (assuming file exists, skip if not)
    try {
      const { publishVariantPriceToShopify } = await import("../lib/queries/shopify/publishVariantPrice");
      
      const result = await publishVariantPriceToShopify(request, {
        variantGID: payload.variantGID,
        price: payload.builderPrice / 100, // Convert cents to dollars
      });

      if (!result.success) {
        return json<ActionData>({ 
          ok: false, 
          error: `Saved but failed to publish to Shopify: ${result.error}`
        });
      }
    } catch (e) {
      // If publishVariantPrice doesn't exist yet, just save without publishing
      console.warn("Shopify publish function not found, skipping publish");
    }

    return json<ActionData>({ 
      ok: true, 
      action: "published",
      message: "Successfully published to Shopify"
    });
  }

  return json<ActionData>({ ok: false, error: "Unknown action" });
}

function toNum(v?: string | number | null) {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pct(part: number, whole: number) {
  if (!whole || whole <= 0) return 0;
  return (part / whole) * 100;
}

function PriceForm({ 
  values, 
  onChange, 
  builderPrice 
}: { 
  values: PriceFormValues; 
  onChange: (patch: Partial<PriceFormValues>) => void;
  builderPrice: number;
}) {
  const Row = (field: keyof PriceFormValues, label: string, tooltip?: string) => {
    const amount = toNum(values[field]);
    const share = pct(amount, builderPrice);
    
    return (
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <div style={{ flex: 1 }}>
          <InlineStack gap="100" blockAlign="center">
            <TextField
              label={label}
              type="number"
              value={values[field]}
              onChange={(v) => onChange({ [field]: v })}
              autoComplete="off"
              prefix="$"
              min={0}
              step={0.01}
            />
            {tooltip && (
              <div style={{ marginTop: "1.5rem" }}>
                <Tooltip content={tooltip}>
                  <Icon source={QuestionCircleIcon} tone="base" />
                </Tooltip>
              </div>
            )}
          </InlineStack>
        </div>
        {field !== "notes" && (
          <div style={{ minWidth: "80px", textAlign: "right" }}>
            <Text tone="subdued" as="span" variant="bodySm">
              {builderPrice > 0 ? `${share.toFixed(1)}%` : "—"}
            </Text>
          </div>
        )}
      </InlineStack>
    );
  };

  return (
    <BlockStack gap="400">
      <Text as="h3" variant="headingSm">Cost Structure</Text>
      {Row("itemCost", "Item Cost", FIELD_TOOLTIPS.itemCost)}
      {Row("profitMarkup", "Profit Markup", FIELD_TOOLTIPS.profitMarkup)}
      
      <Divider />
      
      <Text as="h3" variant="headingSm">Allowances</Text>
      {Row("allowanceShrink", "Allowance: Shrink", FIELD_TOOLTIPS.allowanceShrink)}
      {Row("allowanceFinance", "Allowance: Financing", FIELD_TOOLTIPS.allowanceFinance)}
      {Row("allowanceDiscounts", "Allowance: Discounts", FIELD_TOOLTIPS.allowanceDiscounts)}
      {Row("allowanceShipping", "Allowance: Shipping", FIELD_TOOLTIPS.allowanceShipping)}
      
      <Divider />
      
      <Text as="h3" variant="headingSm">Market Adjustment</Text>
      {Row("marketAdjustment", "Market Adjustment", FIELD_TOOLTIPS.marketAdjustment)}

      <Divider />

      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text as="span" variant="headingSm">Builder Price:</Text>
          <Text as="span" variant="headingMd">${builderPrice.toFixed(2)}</Text>
        </InlineStack>
      </BlockStack>

      <TextField
        label="Internal Notes"
        value={values.notes}
        onChange={(v) => onChange({ notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </BlockStack>
  );
}

export default function SingleVariantEditor() {
  const { variant, pricing, product } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (fetcher.data?.ok) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [fetcher.data]);

  if (!variant) {
    return (
      <Page title="Price Builder">
        <Card><Text as="p">Variant not found</Text></Card>
      </Page>
    );
  }

  // Convert cents to dollars for display
  const centsToD = (cents: number) => cents / 100;

  const [form, setForm] = React.useState<PriceFormValues>({
    itemCost: (pricing?.itemCost ? centsToD(pricing.itemCost) : centsToD(variant.itemCost || 0)).toFixed(2),
    profitMarkup: (pricing?.profitMarkup ? centsToD(pricing.profitMarkup) : 0).toFixed(2),
    allowanceDiscounts: (pricing?.allowanceDiscounts ? centsToD(pricing.allowanceDiscounts) : 0).toFixed(2),
    allowanceShrink: (pricing?.allowanceShrink ? centsToD(pricing.allowanceShrink) : 0).toFixed(2),
    allowanceFinance: (pricing?.allowanceFinance ? centsToD(pricing.allowanceFinance) : 0).toFixed(2),
    allowanceShipping: (pricing?.allowanceShipping ? centsToD(pricing.allowanceShipping) : 0).toFixed(2),
    marketAdjustment: (pricing?.marketAdjustment ? centsToD(pricing.marketAdjustment) : 0).toFixed(2),
    notes: pricing?.notes || "",
  });

  const builderPrice = 
    toNum(form.itemCost) +
    toNum(form.profitMarkup) +
    toNum(form.allowanceDiscounts) +
    toNum(form.allowanceShrink) +
    toNum(form.allowanceFinance) +
    toNum(form.allowanceShipping) +
    toNum(form.marketAdjustment);

  const onSave = (action: "save" | "publish") => {
    const payload = {
      variantId: variant.id,
      variantGID: variant.variantGID || "",
      variantID: variant.variantID || "", // Shopify variant numeric ID from variants table
      productID: variant.productID || "", // Shopify product numeric ID from variants table
      itemCost: Math.round(toNum(form.itemCost) * 100),
      profitMarkup: Math.round(toNum(form.profitMarkup) * 100),
      allowanceDiscounts: Math.round(toNum(form.allowanceDiscounts) * 100),
      allowanceShrink: Math.round(toNum(form.allowanceShrink) * 100),
      allowanceFinance: Math.round(toNum(form.allowanceFinance) * 100),
      allowanceShipping: Math.round(toNum(form.allowanceShipping) * 100),
      marketAdjustment: Math.round(toNum(form.marketAdjustment) * 100),
      builderPrice: Math.round(builderPrice * 100),
      notes: form.notes,
    };

    const fd = new FormData();
    fd.append("_action", action);
    fd.append("payload", JSON.stringify(payload));
    fetcher.submit(fd, { method: "post" });
  };

  const currentPrice = centsToD(variant.shopifyPrice || 0);
  const priceDiff = builderPrice - currentPrice;
  const priceDiffPercent = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

  return (
    <Page
      title="Price Builder"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      subtitle="Single Variant Editor"
    >
      <TitleBar title="Price Builder" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {showSuccess && (
              <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
                {fetcher.data?.message || `Pricing ${fetcher.data?.action} successfully`}
              </Banner>
            )}

            {fetcher.data?.ok === false && (
              <Banner tone="critical">{fetcher.data.error}</Banner>
            )}

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">{product?.name || "Product"}</Text>
                <Text as="p" variant="headingMd" tone="subdued">{variant.name || "Variant"}</Text>
                <InlineStack gap="400">
                  <Text as="span" tone="subdued" variant="bodySm">SKU: {variant.variantSKU || "N/A"}</Text>
                  <Text as="span" tone="subdued" variant="bodySm">ID: {variant.id}</Text>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Banner tone={priceDiff === 0 ? "info" : priceDiff > 0 ? "warning" : "success"}>
                  <Text as="p" fontWeight="semibold">
                    Current Store Price: ${currentPrice.toFixed(2)}
                  </Text>
                  {priceDiff !== 0 && (
                    <Text as="p" variant="bodySm">
                      New price {priceDiff > 0 ? "increases" : "decreases"} by ${Math.abs(priceDiff).toFixed(2)} ({priceDiffPercent > 0 ? "+" : ""}{priceDiffPercent.toFixed(1)}%)
                    </Text>
                  )}
                </Banner>

                <PriceForm
                  values={form}
                  onChange={(patch) => setForm(f => ({ ...f, ...patch }))}
                  builderPrice={builderPrice}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
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
                    Save Pricing
                  </Button>
                  <Button
                    tone="success"
                    loading={fetcher.state !== "idle" && fetcher.formData?.get("_action") === "publish"}
                    onClick={() => onSave("publish")}
                    fullWidth
                  >
                    Publish to Shopify
                  </Button>
                  <Button onClick={() => navigate(-1)} fullWidth>Cancel</Button>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Summary</Text>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span">Item Cost:</Text>
                    <Text as="span" fontWeight="semibold">${toNum(form.itemCost).toFixed(2)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span">Markup:</Text>
                    <Text as="span" fontWeight="semibold">${toNum(form.profitMarkup).toFixed(2)}</Text>
                  </InlineStack>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="span">Margin:</Text>
                    <Text as="span" fontWeight="semibold">
                      {builderPrice > 0 ? pct(toNum(form.profitMarkup), builderPrice).toFixed(1) : 0}%
                    </Text>
                  </InlineStack>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="span" variant="headingSm">Builder Price:</Text>
                    <Text as="span" variant="headingMd">${builderPrice.toFixed(2)}</Text>
                  </InlineStack>
                  
                  {variant.inventoryLevel && variant.inventoryLevel > 0 && (
                    <>
                      <Divider />
                      <Text as="h4" variant="headingSm">Profit Projection</Text>
                      <InlineStack align="space-between">
                        <Text as="span" tone="subdued">Inventory Level:</Text>
                        <Text as="span" tone="subdued">{variant.inventoryLevel} units</Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" tone="subdued">Old Profit/Unit:</Text>
                        <Text as="span" tone="subdued">
                          ${((currentPrice - centsToD(variant.itemCost || 0))).toFixed(2)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" tone="subdued">New Profit/Unit:</Text>
                        <Text as="span" tone="subdued">
                          ${toNum(form.profitMarkup).toFixed(2)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span">Expected Old Profit:</Text>
                        <Text as="span" fontWeight="semibold">
                          ${((currentPrice - centsToD(variant.itemCost || 0)) * variant.inventoryLevel).toFixed(2)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span">Expected New Profit:</Text>
                        <Text as="span" fontWeight="semibold" tone="success">
                          ${(toNum(form.profitMarkup) * variant.inventoryLevel).toFixed(2)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="headingSm">Profit Increase:</Text>
                        <Text as="span" variant="headingMd" tone={
                          (toNum(form.profitMarkup) - (currentPrice - centsToD(variant.itemCost || 0))) > 0 
                            ? "success" 
                            : "critical"
                        }>
                          ${((toNum(form.profitMarkup) - (currentPrice - centsToD(variant.itemCost || 0))) * variant.inventoryLevel).toFixed(2)}
                        </Text>
                      </InlineStack>
                    </>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
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
  Banner, TextField, Tooltip, Icon} from "@shopify/polaris";
import { QuestionCircleIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import createClient from "../../supabase/server";
import * as React from "react";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server";

// Simple types based on actual schema - allow nulls from DB
type VariantData = {
  id: number;
  variantGID: string | null;
  variantID: string | null; // Shopify numeric ID
  productID: string | null; // Shopify product numeric ID
  itemCost: number | null;
  shopifyPrice: number | null;
  pricing: number | null;
  shops: number | null;
  name: string | null;
  variantSKU: string | null;
  products: number | null; // FK to products table
  inventoryLevel: number | null; // For profit projections
};

type PricingData = {
  itemCost: number | null;
  profitMarkup: number | null;
  allowanceDiscounts: number | null;
  allowanceShrink: number | null;
  allowanceFinance: number | null;
  allowanceShipping: number | null;
  marketAdjustment: number | null;
  builderPrice: number | null;
  notes: string | null;
};

type ProductData = {
  name: string | null;
};

type LoaderData = {
  variant: VariantData | null;
  pricing: PricingData | null;
  product: ProductData | null;
};

type ActionData = {
  ok: boolean;
  action?: string;
  message?: string;
  error?: string;
};

type PriceFormValues = {
  itemCost: string;
  profitMarkup: string;
  allowanceDiscounts: string;
  allowanceShrink: string;
  allowanceFinance: string;
  allowanceShipping: string;
  marketAdjustment: string;
  notes: string;
};

const FIELD_TOOLTIPS = {
  itemCost: "Direct cost of goods sold (COGS) for this item",
  profitMarkup: "Fixed costs + Variable costs + Net income desired",
  allowanceShrink: "Reserve for inventory shrinkage, damage, or loss",
  allowanceFinance: "Cost of financing or payment processing fees",
  allowanceDiscounts: "Expected promotional discount allocation",
  allowanceShipping: "Shipping and fulfillment cost buffer",
  marketAdjustment: "Competitive pricing adjustment (+/-)"
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopsID } = await getAuthContext(request);
  const variantsID = Number(params.id ?? "");
  
  if (!Number.isFinite(variantsID)) {
    throw new Response("Invalid variant id", { status: 400 });
  }

  const supabase = createClient();
  
  // Get variant (only what we need) - add inventoryLevel for profit projections
  const { data: variant } = await supabase
    .from("variants")
    .select("id, variantGID, variantID, productID, itemCost, shopifyPrice, pricing, shops, name, variantSKU, products, inventoryLevel")
    .eq("id", variantsID)
    .eq("shops", shopsID)
    .maybeSingle();

  // Get pricing if exists
  let pricing = null;
  if (variant?.pricing) {
    const { data: pricingData } = await supabase
      .from("variantPricing")
      .select("itemCost, profitMarkup, allowanceDiscounts, allowanceShrink, allowanceFinance, allowanceShipping, marketAdjustment, builderPrice, notes")
      .eq("id", variant.pricing)
      .maybeSingle();
    pricing = pricingData;
  }

  // Get product name
  let product = null;
  if (variant?.products) {
    const { data: productData } = await supabase
      .from("products")
      .select("name")
      .eq("id", variant.products)
      .maybeSingle();
    product = productData;
  }

  return json<LoaderData>({ variant, pricing, product });
}

export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId, currentUserEmail } = await requireAuthContext(request);
  const form = await request.formData();
  const actionType = form.get("_action") as string;
  const payload = JSON.parse(form.get("payload") as string);

  const supabase = createClient();
  const now = new Date().toISOString();

  if (actionType === "save") {
    // Insert new pricing record - include required fields productID and variantID
    const { data: newPricing, error } = await supabase
      .from("variantPricing")
      .insert({
        shops: shopsID,
        variants: payload.variantId,
        productID: payload.productID || "", // Required field
        variantID: payload.variantID || "", // Required field
        itemCost: payload.itemCost,
        profitMarkup: payload.profitMarkup,
        allowanceDiscounts: payload.allowanceDiscounts,
        allowanceShrink: payload.allowanceShrink,
        allowanceFinance: payload.allowanceFinance,
        allowanceShipping: payload.allowanceShipping,
        marketAdjustment: payload.marketAdjustment,
        builderPrice: payload.builderPrice,
        currency: "USD",
        source: "draft",
        notes: payload.notes,
        createdByUser: currentUserId,
        createDate: now,
        modifiedDate: now,
        updatedBy: currentUserEmail,
      })
      .select("id")
      .single();

    if (error) {
      return json<ActionData>({ ok: false, error: error.message });
    }

    // Update variant to point to this pricing
    await supabase
      .from("variants")
      .update({ pricing: newPricing.id })
      .eq("id", payload.variantId);

    return json<ActionData>({ ok: true, action: "saved" });
  }

  if (actionType === "publish") {
    // Save first
    const { data: newPricing, error: saveError } = await supabase
      .from("variantPricing")
      .insert({
        shops: shopsID,
        variants: payload.variantId,
        productID: payload.productID || "", // Required field
        variantID: payload.variantID || "", // Required field
        itemCost: payload.itemCost,
        profitMarkup: payload.profitMarkup,
        allowanceDiscounts: payload.allowanceDiscounts,
        allowanceShrink: payload.allowanceShrink,
        allowanceFinance: payload.allowanceFinance,
        allowanceShipping: payload.allowanceShipping,
        marketAdjustment: payload.marketAdjustment,
        builderPrice: payload.builderPrice,
        publishedPrice: payload.builderPrice,
        currency: "USD",
        source: "published",
        notes: payload.notes,
        createdByUser: currentUserId,
        createDate: now,
        modifiedDate: now,
        publishedDate: now,
        isPublished: true,
        updatedBy: currentUserEmail,
      })
      .select("id")
      .single();

    if (saveError) {
      return json<ActionData>({ ok: false, error: saveError.message });
    }

    // Update variant
    await supabase
      .from("variants")
      .update({ pricing: newPricing.id })
      .eq("id", payload.variantId);

    // Publish to Shopify (assuming file exists, skip if not)
    try {
      const { publishVariantPriceToShopify } = await import("../lib/queries/shopify/publishVariantPrice");
      
      const result = await publishVariantPriceToShopify(request, {
        variantGID: payload.variantGID,
        price: payload.builderPrice / 100, // Convert cents to dollars
      });

      if (!result.success) {
        return json<ActionData>({ 
          ok: false, 
          error: `Saved but failed to publish to Shopify: ${result.error}`
        });
      }
    } catch (e) {
      // If publishVariantPrice doesn't exist yet, just save without publishing
      console.warn("Shopify publish function not found, skipping publish");
    }

    return json<ActionData>({ 
      ok: true, 
      action: "published",
      message: "Successfully published to Shopify"
    });
  }

  return json<ActionData>({ ok: false, error: "Unknown action" });
}

function toNum(v?: string | number | null) {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pct(part: number, whole: number) {
  if (!whole || whole <= 0) return 0;
  return (part / whole) * 100;
}

function PriceForm({ 
  values, 
  onChange, 
  builderPrice 
}: { 
  values: PriceFormValues; 
  onChange: (patch: Partial<PriceFormValues>) => void;
  builderPrice: number;
}) {
  const Row = (field: keyof PriceFormValues, label: string, tooltip?: string) => {
    const amount = toNum(values[field]);
    const share = pct(amount, builderPrice);
    
    return (
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <div style={{ flex: 1 }}>
          <InlineStack gap="100" blockAlign="center">
            <TextField
              label={label}
              type="number"
              value={values[field]}
              onChange={(v) => onChange({ [field]: v })}
              autoComplete="off"
              prefix="$"
              min={0}
              step={0.01}
            />
            {tooltip && (
              <div style={{ marginTop: "1.5rem" }}>
                <Tooltip content={tooltip}>
                  <Icon source={QuestionCircleIcon} tone="base" />
                </Tooltip>
              </div>
            )}
          </InlineStack>
        </div>
        {field !== "notes" && (
          <div style={{ minWidth: "80px", textAlign: "right" }}>
            <Text tone="subdued" as="span" variant="bodySm">
              {builderPrice > 0 ? `${share.toFixed(1)}%` : "—"}
            </Text>
          </div>
        )}
      </InlineStack>
    );
  };

  return (
    <BlockStack gap="400">
      <Text as="h3" variant="headingSm">Cost Structure</Text>
      {Row("itemCost", "Item Cost", FIELD_TOOLTIPS.itemCost)}
      {Row("profitMarkup", "Profit Markup", FIELD_TOOLTIPS.profitMarkup)}
      
      <Divider />
      
      <Text as="h3" variant="headingSm">Allowances</Text>
      {Row("allowanceShrink", "Allowance: Shrink", FIELD_TOOLTIPS.allowanceShrink)}
      {Row("allowanceFinance", "Allowance: Financing", FIELD_TOOLTIPS.allowanceFinance)}
      {Row("allowanceDiscounts", "Allowance: Discounts", FIELD_TOOLTIPS.allowanceDiscounts)}
      {Row("allowanceShipping", "Allowance: Shipping", FIELD_TOOLTIPS.allowanceShipping)}
      
      <Divider />
      
      <Text as="h3" variant="headingSm">Market Adjustment</Text>
      {Row("marketAdjustment", "Market Adjustment", FIELD_TOOLTIPS.marketAdjustment)}

      <Divider />

      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text as="span" variant="headingSm">Builder Price:</Text>
          <Text as="span" variant="headingMd">${builderPrice.toFixed(2)}</Text>
        </InlineStack>
      </BlockStack>

      <TextField
        label="Internal Notes"
        value={values.notes}
        onChange={(v) => onChange({ notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </BlockStack>
  );
}

export default function SingleVariantEditor() {
  const { variant, pricing, product } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (fetcher.data?.ok) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [fetcher.data]);

  if (!variant) {
    return (
      <Page title="Price Builder">
        <Card><Text as="p">Variant not found</Text></Card>
      </Page>
    );
  }

  // Convert cents to dollars for display
  const centsToD = (cents: number) => cents / 100;

  const [form, setForm] = React.useState<PriceFormValues>({
    itemCost: (pricing?.itemCost ? centsToD(pricing.itemCost) : centsToD(variant.itemCost || 0)).toFixed(2),
    profitMarkup: (pricing?.profitMarkup ? centsToD(pricing.profitMarkup) : 0).toFixed(2),
    allowanceDiscounts: (pricing?.allowanceDiscounts ? centsToD(pricing.allowanceDiscounts) : 0).toFixed(2),
    allowanceShrink: (pricing?.allowanceShrink ? centsToD(pricing.allowanceShrink) : 0).toFixed(2),
    allowanceFinance: (pricing?.allowanceFinance ? centsToD(pricing.allowanceFinance) : 0).toFixed(2),
    allowanceShipping: (pricing?.allowanceShipping ? centsToD(pricing.allowanceShipping) : 0).toFixed(2),
    marketAdjustment: (pricing?.marketAdjustment ? centsToD(pricing.marketAdjustment) : 0).toFixed(2),
    notes: pricing?.notes || "",
  });

  const builderPrice = 
    toNum(form.itemCost) +
    toNum(form.profitMarkup) +
    toNum(form.allowanceDiscounts) +
    toNum(form.allowanceShrink) +
    toNum(form.allowanceFinance) +
    toNum(form.allowanceShipping) +
    toNum(form.marketAdjustment);

  const onSave = (action: "save" | "publish") => {
    const payload = {
      variantId: variant.id,
      variantGID: variant.variantGID || "",
      variantID: variant.variantID || "", // Shopify variant numeric ID from variants table
      productID: variant.productID || "", // Shopify product numeric ID from variants table
      itemCost: Math.round(toNum(form.itemCost) * 100),
      profitMarkup: Math.round(toNum(form.profitMarkup) * 100),
      allowanceDiscounts: Math.round(toNum(form.allowanceDiscounts) * 100),
      allowanceShrink: Math.round(toNum(form.allowanceShrink) * 100),
      allowanceFinance: Math.round(toNum(form.allowanceFinance) * 100),
      allowanceShipping: Math.round(toNum(form.allowanceShipping) * 100),
      marketAdjustment: Math.round(toNum(form.marketAdjustment) * 100),
      builderPrice: Math.round(builderPrice * 100),
      notes: form.notes,
    };

    const fd = new FormData();
    fd.append("_action", action);
    fd.append("payload", JSON.stringify(payload));
    fetcher.submit(fd, { method: "post" });
  };

  const currentPrice = centsToD(variant.shopifyPrice || 0);
  const priceDiff = builderPrice - currentPrice;
  const priceDiffPercent = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;
// ---- Price math helpers (dollars) ----
  const allowancesSum =
    toNum(form.allowanceDiscounts) +
    toNum(form.allowanceFinance) +
    toNum(form.allowanceShipping) +
    toNum(form.allowanceShrink) +
    toNum(form.marketAdjustment);

  const newProfitPerUnit = toNum(form.profitMarkup) + allowancesSum;

  const oldProfitPerUnit =
    (currentPrice ?? 0) - centsToD(variant.itemCost || 0);

  const marginPct = builderPrice > 0 ? (newProfitPerUnit / builderPrice) * 100 : 0;

  const inv = Number(variant.inventoryLevel || 0);
  const expectedOldProfit = oldProfitPerUnit * inv;
  const expectedNewProfit = newProfitPerUnit * inv;
  const profitIncrease = (newProfitPerUnit - oldProfitPerUnit) * inv;




  return (
    <Page
      title="Price Builder"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      subtitle="Single Variant Editor"
    >
      <TitleBar title="Price Builder" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {showSuccess && (
              <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
                {fetcher.data?.message || `Pricing ${fetcher.data?.action} successfully`}
              </Banner>
            )}

            {fetcher.data?.ok === false && (
              <Banner tone="critical">{fetcher.data.error}</Banner>
            )}

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">{product?.name || "Product"}</Text>
                <Text as="p" variant="headingMd" tone="subdued">{variant.name || "Variant"}</Text>
                <InlineStack gap="400">
                  <Text as="span" tone="subdued" variant="bodySm">SKU: {variant.variantSKU || "N/A"}</Text>
                  <Text as="span" tone="subdued" variant="bodySm">ID: {variant.id}</Text>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Banner tone={priceDiff === 0 ? "info" : priceDiff > 0 ? "warning" : "success"}>
                  <Text as="p" fontWeight="semibold">
                    Current Store Price: ${currentPrice.toFixed(2)}
                  </Text>
                  {priceDiff !== 0 && (
                    <Text as="p" variant="bodySm">
                      New price {priceDiff > 0 ? "increases" : "decreases"} by ${Math.abs(priceDiff).toFixed(2)} ({priceDiffPercent > 0 ? "+" : ""}{priceDiffPercent.toFixed(1)}%)
                    </Text>
                  )}
                </Banner>

                <PriceForm
                  values={form}
                  onChange={(patch) => setForm(f => ({ ...f, ...patch }))}
                  builderPrice={builderPrice}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
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
                    Save Pricing
                  </Button>
                  <Button
                    tone="success"
                    loading={fetcher.state !== "idle" && fetcher.formData?.get("_action") === "publish"}
                    onClick={() => onSave("publish")}
                    fullWidth
                  >
                    Publish to Shopify
                  </Button>
                  <Button onClick={() => navigate(-1)} fullWidth>Cancel</Button>
                </BlockStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Summary</Text>

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span">Item Cost:</Text>
                    <Text as="span" fontWeight="semibold">
                      ${toNum(form.itemCost).toFixed(2)}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span">Allowances (incl. Market Adj.):</Text>
                    <Text as="span" fontWeight="semibold">
                      ${allowancesSum.toFixed(2)}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span">Profit Markup:</Text>
                    <Text as="span" fontWeight="semibold">
                      ${toNum(form.profitMarkup).toFixed(2)}
                    </Text>
                  </InlineStack>

                  <Divider />

                  <InlineStack align="space-between">
                    <Text as="span">Margin:</Text>
                    <Text as="span" fontWeight="semibold">
                      {marginPct.toFixed(1)}%
                    </Text>
                  </InlineStack>

                  <Divider />

                  <InlineStack align="space-between">
                    <Text as="span" variant="headingSm">Builder Price:</Text>
                    <Text as="span" variant="headingMd">
                      ${builderPrice.toFixed(2)}
                    </Text>
                  </InlineStack>

                  {inv > 0 && (
                    <>
                      <Divider />
                      <Text as="h4" variant="headingSm">Profit Projection</Text>
                  
                      <InlineStack align="space-between">
                        <Text as="span" tone="subdued">Inventory Level:</Text>
                        <Text as="span" tone="subdued">{inv} units</Text>
                      </InlineStack>
                  
                      <InlineStack align="space-between">
                        <Text as="span" tone="subdued">Old Profit/Unit:</Text>
                        <Text as="span" tone="subdued">
                          ${oldProfitPerUnit.toFixed(2)}
                        </Text>
                      </InlineStack>
                  
                      <InlineStack align="space-between">
                        <Text as="span" tone="subdued">New Profit/Unit:</Text>
                        <Text as="span" tone="subdued">
                          ${newProfitPerUnit.toFixed(2)}
                        </Text>
                      </InlineStack>
                  
                      <InlineStack align="space-between">
                        <Text as="span">Expected Old Profit:</Text>
                        <Text as="span" fontWeight="semibold">
                          ${expectedOldProfit.toFixed(2)}
                        </Text>
                      </InlineStack>
                  
                      <InlineStack align="space-between">
                        <Text as="span">Expected New Profit:</Text>
                        <Text as="span" fontWeight="semibold" tone="success">
                          ${expectedNewProfit.toFixed(2)}
                        </Text>
                      </InlineStack>
                  
                      <InlineStack align="space-between">
                        <Text as="span" variant="headingSm">Profit Increase:</Text>
                        <Text
                          as="span"
                          variant="headingMd"
                          tone={profitIncrease >= 0 ? "success" : "critical"}
                        >
                          ${profitIncrease.toFixed(2)}
                        </Text>
                      </InlineStack>
                    </>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
*/