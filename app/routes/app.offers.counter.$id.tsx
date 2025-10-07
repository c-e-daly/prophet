// app/routes/app.offers.counter.$counterOffersID.tsx
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
import { getCounterOfferEditorData, upsertCounterOffer
} from "../lib/queries/supabase/getShopCounterOfferData";

// Component registry - maps counter types to their components
const COUNTER_CONFIG_COMPONENTS: Record<CounterType, 
  React.ComponentType<CounterConfigComponentProps>
> = {
  "flat_shipping": FlatShippingConfig,
  "free_shipping": FreeShippingConfig,
  "percent_off_order": PercentOffOrderConfig,
  "percent_off_item": PercentOffOrderConfig,
  "percent_off_next_order": PercentOffOrderConfig,
  "price_markdown": PriceMarkdownOrderConfig,
  "price_markdown_order": PriceMarkdownOrderConfig,
  "bounceback_current": BouncebackFutureConfig,
  "bounceback_future": BouncebackFutureConfig,
  "threshold_one": ThresholdTwoConfig,
  "threshold_two": ThresholdTwoConfig,
  "purchase_with_purchase": PercentOffOrderConfig,
  "gift_with_purchase": PercentOffOrderConfig,
  "flat_shipping_upgrade": FlatShippingConfig,
  "price_markdown_per_unit": PriceMarkdownOrderConfig,
  "price_markdown_bundle": PriceMarkdownOrderConfig,
};

// Props that all config components receive
export type CounterConfigComponentProps = {
  value: CounterConfig;
  onChange: (config: CounterConfig) => void;
  offer: any;
  cart: any;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { counterOffersID } = params;
  const url = new URL(request.url);
  const offersID = url.searchParams.get("offersID");
  
  const authContext = await getAuthContext(request);
  const shops = authContext.shopsID;
  const user = authContext.currentUserId;
  
  const isNew = counterOffersID === "new";
  
  if (isNew && !offersID) {
    throw new Response("Missing offersID parameter for new counter offer", { status: 400 });
  }
  
  // Single query to get all data
  const editorData = await getCounterOfferEditorData(
    shops,
    isNew ? undefined : Number(counterOffersID),
    isNew ? Number(offersID) : undefined
  );
  
  return json({
    isNew,
    ...editorData,
    shops,
    user,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { counterOffersID } = params;
  const authContext = await getAuthContext(request);
  const shops = authContext.shopsID;
  const user = authContext.currentUserId;
  
  const formData = await request.formData();
  const counterType = formData.get("counter_type") as CounterType;
  const counterConfigJson = formData.get("counter_config") as string;
  const headline = formData.get("headline") as string;
  const description = formData.get("description") as string;
  const internalNotes = formData.get("internal_notes") as string;
  const offersID = formData.get("offersID") as string;
  
  const counterConfig = JSON.parse(counterConfigJson) as CounterConfig;
  
  const isNew = counterOffersID === "new";
  
  // Upsert counter offer
  const savedCounter = await upsertCounterOffer({
    id: isNew ? undefined : Number(counterOffersID),
    shop: shops,
    offer: Number(offersID),
    counter_type: counterType,
    counter_config: counterConfig,
    headline,
    description,
    internal_notes: internalNotes,
    created_by_user_id: authContext.currentUserId,
    status: "sent",
  });
  
  return redirect(`/app/offers/counter/${savedCounter.id}`);
}

export default function CounterOfferEditor() {
  const { 
    isNew, 
    offers, 
    carts, 
    cartItems,
    consumers, 
    consumerShop12M, 
    counterOffers 
  } = useLoaderData<typeof loader>();
  
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  // Initialize state from existing counter or defaults
  const [counterType, setCounterType] = useState<CounterType>(
    counterOffers?.counter_type || "percent_off_order"
  );
  const [counterConfig, setCounterConfig] = useState<CounterConfig>(
    counterOffers?.counter_config || getDefaultConfig("percent_off_order")
  );
  const [headline, setHeadline] = useState(counterOffers?.headline || "");
  const [description, setDescription] = useState(counterOffers?.description || "");
  const [internalNotes, setInternalNotes] = useState(counterOffers?.internal_notes || "");
  
  // Update config when type changes
  const handleTypeChange = (newType: CounterType) => {
    setCounterType(newType);
    setCounterConfig(getDefaultConfig(newType));
  };
  
  // Dynamically get the component based on selected type
  const ConfigComponent = COUNTER_CONFIG_COMPONENTS[counterType];
  
  return (
    <Page
      title={isNew ? "Create Counter Offer" : "Edit Counter Offer"}
      backAction={{ 
        content: "Offers", 
        url: "/app/offers" 
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              {/* Hidden fields */}
              <input type="hidden" name="offersID" value={offers.id} />
              <input type="hidden" name="counter_type" value={counterType} />
              <input type="hidden" name="counter_config" value={JSON.stringify(counterConfig)} />
              
              {/* Step 1: Select Counter Type */}
              <Select
                label="Counter Offer Type"
                value={counterType}
                onChange={(value) => handleTypeChange(value as CounterType)}
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
                  <ConfigComponent
                    value={counterConfig}
                    onChange={setCounterConfig}
                    offer={offers}
                    cart={carts}
                  />
                ) : (
                  <Banner tone="warning">
                    No configuration component available for this counter type yet.
                  </Banner>
                )}
              </div>
              
              {/* Step 3: Customer-Facing Content */}
              <div style={{ marginTop: "1.5rem" }}>
                <TextField
                  label="Headline"
                  value={headline}
                  onChange={setHeadline}
                  name="headline"
                  placeholder="Special offer just for you!"
                  helpText="Short, catchy headline customer sees first"
                  autoComplete="off"
                />
                
                <TextField
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  name="description"
                  multiline={4}
                  placeholder="We'd love to make this work for you..."
                  helpText="Full terms and details shown to customer"
                  autoComplete="off"
                />
                
                <TextField
                  label="Internal Notes"
                  value={internalNotes}
                  onChange={setInternalNotes}
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
              <LabelledValue 
                label="Offered Price" 
                value={formatCurrency(offers.amount_cents)} 
              />
              <LabelledValue 
                label="Cart Total" 
                value={formatCurrency(carts.cartTotal)} 
              />
              <LabelledValue 
                label="Discount Requested" 
                value={`${((1 - offers.amount_cents / carts.cartTotal) * 100).toFixed(1)}%`} 
              />
              <LabelledValue 
                label="Items in Cart" 
                value={cartItems?.length || 0} 
              />
            </div>
          </Card>
          
          {/* Customer Context */}
          <Card>
            <PolarisText variant="headingMd" as="h2">Customer Context</PolarisText>
            <div style={{ marginTop: "1rem" }}>
              <LabelledValue 
                label="Portfolio" 
                value={consumerShop12M?.current_portfolio || "Unknown"} 
              />
              <LabelledValue 
                label="Lifetime Orders" 
                value={consumers?.lifetimeOrders || 0} 
              />
              <LabelledValue 
                label="Avg Order Value" 
                value={formatCurrency(consumers?.avgOrderValue || 0)} 
              />
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Helper component
function LabelledValue({ 
  label, 
  value, 
  tone 
}: { 
  label: string; 
  value: string | number; 
  tone?: "success" | "caution" | "critical" | "subdued";
}) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <PolarisText tone="subdued" variant="bodySm" as="span">{label}</PolarisText>
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
      return {
        type: "bounceback_current",
        spend_threshold_cents: 10000,
        reward_cents: 2000,
        validity_days: 30,
      };
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
      return {
        type: "gift_with_purchase",
        required_spend_cents: 10000,
        gift_product_id: 0,
      };
    case "flat_shipping_upgrade":
      return {
        type: "flat_shipping_upgrade",
        upgrade_method: "express",
        upgrade_cost_cents: 1000,
      };
    case "price_markdown_per_unit":
      return {
        type: "price_markdown_per_unit",
        markdown_cents_per_unit: 500,
        item_ids: [],
      };
    case "price_markdown_bundle":
      return {
        type: "price_markdown_bundle",
        markdown_cents: 2000,
        bundle_quantity: 3,
        item_ids: [],
      };
    default:
      return { type: "percent_off_order", percent: 10 };
  }
}

// Helper to format currency
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}