// app/routes/app.offers.counter.$id.tsx
import { useState } from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { Page, Layout, Card, Select, Button, TextField, Text as PolarisText, Banner } from "@shopify/polaris";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import type { CounterType, CounterConfig } from "../lib/types/counterTypes";
import { FlatShippingConfig } from "../components/counters/flatShipping";
import { FreeShippingConfig } from "../components/counters/freeShipping";
import { PercentOffOrderConfig } from "../components/counters/percentOffOrder";
import { BouncebackFutureConfig } from "../components/counters/bouncebackFuture";
import { ThresholdTwoConfig } from "../components/counters/thresholdTwo";
import { PriceMarkdownOrderConfig } from "../components/counters/priceMarkdownOrder";
import { getCounterOfferEditorData } from "../lib/queries/supabase/getShopCounterOfferData";
import { createShopCounterOffer } from "../lib/queries/supabase/createShopCounterOffer";
import type { GetShopCounterOfferEditPayload } from "../lib/types/dbTables";

export type CounterConfigComponentProps = {
  value: CounterConfig;
  onChange: (config: CounterConfig) => void;
  offer: unknown;
  cart: unknown;
};

const COUNTER_CONFIG_COMPONENTS: Record<CounterType, React.ComponentType<CounterConfigComponentProps>> = {
  flat_shipping: FlatShippingConfig,
  free_shipping: FreeShippingConfig,
  percent_off_order: PercentOffOrderConfig,
  percent_off_item: PercentOffOrderConfig,
  percent_off_next_order: PercentOffOrderConfig,
  price_markdown: PriceMarkdownOrderConfig,
  price_markdown_order: PriceMarkdownOrderConfig,
  bounceback_current: BouncebackFutureConfig,
  bounceback_future: BouncebackFutureConfig,
  threshold_one: ThresholdTwoConfig,
  threshold_two: ThresholdTwoConfig,
  purchase_with_purchase: PercentOffOrderConfig,
  gift_with_purchase: PercentOffOrderConfig,
  flat_shipping_upgrade: FlatShippingConfig,
  price_markdown_per_unit: PriceMarkdownOrderConfig,
  price_markdown_bundle: PriceMarkdownOrderConfig,
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id } = params;
  const url = new URL(request.url);
  const offersIDParam = url.searchParams.get("offersID");
  const isNew = id === "new";

  if (isNew && !offersIDParam) {
    throw new Response("Missing offersID parameter for new counter offer", { status: 400 });
  }

  const authContext = await getAuthContext(request);
  const { shopsID: shops, currentUserId: user } = authContext;
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const editorData = await getCounterOfferEditorData(shops, {
    counterOfferId: isNew ? undefined : Number(id),
    offersID: offersIDParam ? Number(offersIDParam) : undefined,
  });

  const payload: GetShopCounterOfferEditPayload & {
    isNew: boolean;
    counterID: number | null;
    offersID: number;
    authContext: { shops: number; user: number };
  } = {
    isNew,
    counterID: isNew ? null : Number(id),
    offersID: offersIDParam ? Number(offersIDParam) : (editorData.offers.id as number),
    ...editorData,
    authContext: { shops, user },
  };

  return json(payload);
} // ✅ close loader properly

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  const formData = await request.formData();
  const isNew = id === "new";

  const offersID = Number(formData.get("offersID"));
  const counterType = formData.get("counter_type") as CounterType;
  const counterConfigJson = formData.get("counter_config") as string;
  const headline = (formData.get("headline") as string) ?? "";
  const description = (formData.get("description") as string) ?? "";
  const internalNotes = (formData.get("internal_notes") as string) ?? "";

  const authContext = await getAuthContext(request);
  const { shopsID: shops, currentUserId: user } = authContext;
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const counterConfig = JSON.parse(counterConfigJson) as CounterConfig;

  const savedCounter = await createShopCounterOffer({
    shops,
    offers: offersID,
    counterType,
    counterConfig,
    headline,
    description,
    internalNotes,
    createdByUser: user,
    // numeric/analytics placeholders (compute later if desired)
    totalDiscountCents: 0,
    counterOfferPrice: 0,
    estimatedMarginPercent: 0,
    estimatedMarginCents: 0,
    originalMarginPercent: 0,
    originalMarginCents: 0,
    marginImpactCents: 0,
    predictedAcceptanceProbability: 0,
    confidenceScore: 0,
    predictionFactors: {},
    expectedRevenueCents: 0,
    expectedMarginCents: 0,
    expectedValueScore: 0,
    requiresApproval: false,
    counterTemplatesId: undefined,
    expiresAt: null,
  });

  return redirect(`/app/offers/${offersID}?counterSent=${savedCounter.id}`);
}

export default function CounterOfferEditor() {
  const {
    isNew,
    counterID,
    offersID,
    offers,
    carts,
    cartItems,
    consumers,
    consumerShop12M, 
    consumerShopCPMS, 
    consumerShopLTV,  
    counterOffers,
    authContext,
  } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const initialType: CounterType = (counterOffers?.counterType as CounterType) ?? "percent_off_order";
  const initialConfig: CounterConfig =
    (counterOffers?.counterConfig as unknown as CounterConfig) ?? getDefaultConfig(initialType);

  const [counterType, setCounterType] = useState<CounterType>(initialType);
  const [counterConfig, setCounterConfig] = useState<CounterConfig>(initialConfig);
  const [headline, setHeadline] = useState(counterOffers?.headline ?? "");
  const [description, setDescription] = useState(counterOffers?.description ?? "");
  const [internalNotes, setInternalNotes] = useState(counterOffers?.internalNotes ?? "");

  const offeredCents = offers.offerPrice ?? 0;
  const cartTotalCents = carts?.cartTotalPrice ?? 0;
  const discountPct = cartTotalCents > 0 ? ((1 - offeredCents / cartTotalCents) * 100).toFixed(1) : "0.0";

  const handleTypeChange = (newType: CounterType) => {
    setCounterType(newType);
    setCounterConfig(getDefaultConfig(newType));
  };

  const ConfigComponent = COUNTER_CONFIG_COMPONENTS[counterType];

  return (
    <Page
      title={isNew ? "Create Counter Offer" : `Edit Counter Offer #${counterID}`}
      backAction={{ content: "Back to Offer", url: `/app/offers/${offersID}` }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              {/* Hidden fields */}
              <input type="hidden" name="offersID" value={offersID} />
              <input type="hidden" name="counter_type" value={counterType} />
              <input type="hidden" name="counter_config" value={JSON.stringify(counterConfig)} />

              {/* Step 1: Select Counter Type */}
              <Select
                label="Counter Offer Type"
                value={counterType}
                onChange={(value, _id) => handleTypeChange(value as CounterType)} 
                options={[
                  { label: "Percent Off Order", value: "percent_off_order" },
                  { label: "Price Markdown", value: "price_markdown_order" },
                  { label: "Flat Shipping", value: "flat_shipping" },
                  { label: "Free Shipping", value: "free_shipping" },
                  { label: "Future Bounceback", value: "bounceback_future" },
                  { label: "Current Bounceback", value: "bounceback_current" },
                  { label: "Tiered Discount", value: "threshold_two" },
                  { label: "Single Threshold", value: "threshold_one" },
                  { label: "Percent Off Item", value: "percent_off_item" },
                  { label: "Percent Off Next Order", value: "percent_off_next_order" },
                  { label: "Price Markdown", value: "price_markdown" },
                  { label: "Purchase with Purchase", value: "purchase_with_purchase" },
                  { label: "Gift with Purchase", value: "gift_with_purchase" },
                  { label: "Shipping Upgrade", value: "flat_shipping_upgrade" },
                  { label: "Per Unit Markdown", value: "price_markdown_per_unit" },
                  { label: "Bundle Markdown", value: "price_markdown_bundle" },
                ]}
              />

              {/* Step 2: Dynamic Config Component */}
              <div style={{ marginTop: "1rem" }}>
                {ConfigComponent ? (
                  <ConfigComponent value={counterConfig} onChange={setCounterConfig} offer={offers} cart={carts} />
                ) : (
                  <Banner tone="warning">No configuration component available for this counter type yet.</Banner>
                )}
              </div>

              {/* Step 3: Customer-Facing Content */}
              <div style={{ marginTop: "1.5rem" }}>
                <TextField
                  label="Headline"
                  value={headline}
                  onChange={(v, _id) => setHeadline(v)}
                  name="headline"
                  placeholder="Special offer just for you!"
                  helpText="Short, catchy headline customer sees first"
                  autoComplete="off"
                />

                <TextField
                  label="Description"
                  value={description}
                  onChange={(v, _id) => setDescription(v)}
                  name="description"
                  multiline={4}
                  placeholder="We'd love to make this work for you..."
                  helpText="Full terms and details shown to customer"
                  autoComplete="off"
                />

                <TextField
                  label="Internal Notes"
                  value={internalNotes}
                  onChange={(v, _id) => setInternalNotes(v)}
                  name="internal_notes"
                  multiline={2}
                  placeholder="Why this strategy was chosen..."
                  helpText="Private notes for your team (not shown to customer)"
                  autoComplete="off"
                />
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <Button submit variant="primary" loading={isSubmitting}>
                  {isNew ? "Send Counter Offer" : "Update Counter Offer"}
                </Button>
              </div>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          {/* Offer Context */}
          <Card>
            <PolarisText variant="headingMd" as="h2">Original Offer</PolarisText>
            <div style={{ marginTop: "1rem" }}>
              <LabelledValue label="Offered Price" value={formatCurrency(offeredCents)} />
              <LabelledValue label="Cart Total" value={formatCurrency(cartTotalCents)} />
              <LabelledValue label="Discount Requested" value={`${discountPct}%`} />
              <LabelledValue label="Items in Cart" value={cartItems?.length ?? 0} />
            </div>
          </Card>

          {/* Customer Context */}
          <Card>
            <PolarisText variant="headingMd" as="h2">Customer Context</PolarisText>
            <div style={{ marginTop: "1rem" }}>
              <LabelledValue label="Current Portfolio" value={consumerShopCPMS?.name ?? "Unknown"} />
              <LabelledValue label="Lifetime Orders" value={consumerShopLTV?.totalOrders ?? 0} />
              <LabelledValue label="Lifetime AOV" value={formatCurrency(consumerShopLTV?.averageOrderValue ?? 0)} />
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function LabelledValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "caution" | "critical" | "subdued";
}) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <PolarisText tone="subdued" variant="bodySm" as="span">
        {label}
      </PolarisText>
      <br />
      <PolarisText fontWeight="semibold" tone={tone} as="span">
        {value}
      </PolarisText>
    </div>
  );
}

// Helper to get default config for each type
function getDefaultConfig(type: CounterType): CounterConfig {
  switch (type) {
    case "flat_shipping":
      return { type: "flat_shipping", shipping_cost_cents: 500 };
    case "free_shipping":
      return { type: "free_shipping" };
    case "percent_off_order":
      return { type: "percent_off_order", percent: 10 };
    case "percent_off_item":
      return { type: "percent_off_item", percent: 10, item_ids: [] };
    case "percent_off_next_order":
      return { type: "percent_off_next_order", percent: 10, validity_days: 30 };
    case "price_markdown":
      return { type: "price_markdown", markdown_cents: 1000, item_ids: [] };
    case "price_markdown_order":
      return { type: "price_markdown_order", markdown_cents: 1000 };
    case "bounceback_current":
      return { type: "bounceback_current", spend_threshold_cents: 10000, reward_cents: 2000, validity_days: 30 };
    case "bounceback_future":
      return {
        type: "bounceback_future",
        next_order_threshold_cents: 10000,
        reward_cents: 2000,
        validity_days: 60,
        from_date: "order_date",
      };
    case "threshold_one":
      return {
        type: "threshold_one",
        thresholds: [
          { min_spend_cents: 0, discount_percent: 10 },
          { min_spend_cents: 15000, discount_percent: 15 },
        ],
      };
    case "threshold_two":
      return {
        type: "threshold_two",
        thresholds: [
          { min_spend_cents: 0, discount_percent: 10 },
          { min_spend_cents: 15000, discount_percent: 15 },
          { min_spend_cents: 25000, discount_percent: 20 },
        ],
      };
    case "purchase_with_purchase":
      return {
        type: "purchase_with_purchase",
        required_product_ids: [],
        bonus_product_id: 0,
        bonus_price_cents: 0,
      };
    case "gift_with_purchase":
      return { type: "gift_with_purchase", required_spend_cents: 10000, gift_product_id: 0 };
    case "flat_shipping_upgrade":
      return { type: "flat_shipping_upgrade", upgrade_method: "express", upgrade_cost_cents: 1000 };
    case "price_markdown_per_unit":
      return { type: "price_markdown_per_unit", markdown_cents_per_unit: 500, item_ids: [] };
    case "price_markdown_bundle":
      return { type: "price_markdown_bundle", markdown_cents: 2000, bundle_quantity: 3, item_ids: [] };
    default:
      return { type: "percent_off_order", percent: 10 };
  }
}

// Helper to format currency
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);
}
