// app/routes/app.offers.$id.counter.tsx
// app/routes/app.offers.$id.counter.tsx

import { useState, useEffect } from "react";
import { useLoaderData, Form } from "@remix-run/react";
import { Page, Layout, Card, Select, Button, Text } from "@shopify/polaris";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getCounterTemplates } from "../lib/queries/supabase/getCounterTemplates";
import { calculateExpectedValue } from "../lib/calculations/counterofferForecasting";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const offerId = Number(params.id);
  
  // Your existing loader logic
  const offer = await getOfferById(offerId);
  const cart = await getCartForOffer(offerId);
  const consumer = await getConsumerForOffer(offerId);
  const portfolio = await getPortfolioForConsumer(consumer.id);
  
  // NEW: Load templates
  const templates = await getCounterTemplates(offer.shops);
  
  return json({ offer, cart, consumer, portfolio, templates });
}

export default function CounterOfferBuilder() {
  const { offer, cart, consumer, portfolio, templates } = useLoaderData<typeof loader>();
  
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [counterType, setCounterType] = useState('percent_off_order');
  const [discountValue, setDiscountValue] = useState(15);
  
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  
  // Auto-fill from template when selected
  useEffect(() => {
    if (selectedTemplate) {
      setCounterType(selectedTemplate.counter_type);
      // Pre-fill other fields from template...
    }
  }, [selectedTemplateId]);
  
  return (
    <Page title={`Counter Offer for #${offer.id}`}>
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Build Counter Offer</Text>
            
            {/* TEMPLATE SELECTOR */}
            <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <Select
                label="Start with a template?"
                value={selectedTemplateId?.toString() || ""}
                onChange={(val) => {
                  setSelectedTemplateId(val ? Number(val) : null);
                  setUseTemplate(!!val);
                }}
                options={[
                  { label: "Build custom counter", value: "" },
                  ...templates.map(t => ({
                    label: `${t.template_name} (${t.category})`,
                    value: t.id.toString()
                  }))
                ]}
              />
              
              {selectedTemplate && (
                <div style={{ 
                  marginTop: "0.5rem", 
                  padding: "1rem", 
                  background: "#f6f6f7", 
                  borderRadius: "8px" 
                }}>
                  <Text variant="bodyMd" fontWeight="semibold">
                    {selectedTemplate.template_name}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    {selectedTemplate.description}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Used {selectedTemplate.times_used} times • {selectedTemplate.acceptance_rate?.toFixed(1)}% acceptance
                  </Text>
                </div>
              )}
            </div>
            
            <Form method="post">
              {/* Your existing counter builder form */}
              {/* But now pre-filled with template values if selected */}
              
              <input type="hidden" name="template_id" value={selectedTemplateId || ""} />
              
              {/* Rest of your form... */}
            </Form>
          </Card>
        </Layout.Section>
        
        {/* Your existing Forecast panel */}
      </Layout>
    </Page>
  );
}

/*
import { useState, useEffect } from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import {  Page, Card, Layout, Select, FormLayout, TextField, Button, Badge,  Text, Divider } from "@shopify/polaris";
import { calculateExpectedValue } from "../lib/queries/supabase/counterOfferForecasting";
import { formatUSD, formatPercent } from "../utils/format";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { COUNTER_TYPE_DESCRIPTIONS } from "../lib/types/counterTypeLabels";
import type { CounterType, CounterConfig } from "../lib/types/counterTypes";
import type { ForecastInput, ForecastOutput } from "../lib/queries/supabase/counterOfferForecasting";
import { getShopSingleOffer } from "../lib/queries/supabase/getShopSingleOffer";


// Helper to build counter config based on type
function buildCounterConfig(type: CounterType, value: number): CounterConfig {
  switch (type) {
    case 'percent_off_order':
      return { type: 'percent_off_order', percent: value };
    case 'price_markdown_order':
      return { type: 'price_markdown_order', markdown_cents: value * 100};
    case 'bounceback_current':
      return { 
        type: 'bounceback_current', 
        spend_threshold_cents: value * 100, 
        reward_cents: 2000, 
        validity_days: 30 
      };
    case 'bounceback_future':
      return { 
        type: 'bounceback_future', 
        next_order_threshold_cents: 10000, 
        reward_cents: value * 100, 
        validity_days: 60,
        from_date: 'order_date'
      };
    case 'threshold_two':
      return {
        type: 'threshold_two',
        thresholds: [
          { min_spend_cents: 0, discount_percent: 10 },
          { min_spend_cents: 15000, discount_percent: 15 },
          { min_spend_cents: 25000, discount_percent: 20 }
        ]
      };
    case 'free_shipping':
      return { type: 'free_shipping' };
    default:
      return { type: 'percent_off_order', percent: 10 };
  }
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const offersID = Number(params.id);
  
  if (!offersID) {
    throw new Response("Missing offer id", { status: 400 });
  }
  
  const result = await getShopSingleOffer({
    request,
    shopsID,
    offersID,
  });
  
  return json(result);
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { shopsID, currentUserId } = await getAuthContext(request);
  const offersID = Number(params.id);
  const formData = await request.formData();
  
  const counterType = formData.get('counter_type') as CounterType;
  const discountValue = Number(formData.get('discount_value'));
  const description = formData.get('description') as string;
  const internalNotes = formData.get('internal_notes') as string;
  
  // TODO: Create counter offer in database
  // const counterId = await createShopCounterOffer(shopsID, {
  //   offerId: offersID,
  //   counterType,
  //   counterConfig: buildCounterConfig(counterType, discountValue),
  //   description,
  //   internalNotes,
  //   createdByUserId: currentUserId,
  // });
  
  return redirect(`/app/offers/${offersID}`);
};

export default function CounterOfferBuilder() {
  const { offer, consumerShop12m, math, lineItems } = useLoaderData<typeof loader>();
  
  const [counterType, setCounterType] = useState<CounterType>('percent_off_order');
  const [discountValue, setDiscountValue] = useState(15);
  const [forecast, setForecast] = useState<ForecastOutput | null>(null);
  
  // Calculate forecast whenever inputs change
  useEffect(() => {
    if (!offer.carts) return; // Guard clause
    
    const config = buildCounterConfig(counterType, discountValue);
    
    // Calculate COGS from line items (sum of 'Settle' rows only)
    const totalCOGS = lineItems
      .filter(item => item.status === 'Settle')
      .reduce((sum, item) => sum + (item.cogs * item.qty), 0);
    
    // Convert dollars to cents for the forecasting engine
    const dollarsToCents = (dollars: number) => Math.round(dollars * 100);
    
    // Calculate days since last purchase
    const daysSinceLastPurchase = consumerShop12m?.lastPurchaseDate 
      ? Math.floor((Date.now() - new Date(consumerShop12m.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    // Calculate avg order value
    const avgOrderValue = consumerShop12m?.orders && consumerShop12m.orders > 0
      ? (consumerShop12m.netSales || 0) / consumerShop12m.orders
      : 0;
    
    const input: ForecastInput = {
      // All values converted from dollars → cents
      cartTotalCents: dollarsToCents(offer.carts.cartTotalPrice || 0),
      cartCostsCents: dollarsToCents(totalCOGS),
      shippingRevenueCents: 0, // No shipping field in carts table
      shippingCostCents: 0,
      counterType,
      counterConfig: config,
      customerPortfolio: 'new', // TODO: Get from portfolio table
      customerLifetimeOrders: consumerShop12m?.orders || 0,
      customerAvgOrderValue: dollarsToCents(avgOrderValue),
      daysSinceLastOrder: daysSinceLastPurchase,
      historicalAcceptanceRate: undefined,
      similarCountersAccepted: 0,
      similarCountersTotal: 0,
    };
    
    const result = calculateExpectedValue(input);
    setForecast(result);
  }, [counterType, discountValue, offer, math, consumerShop12m, lineItems]);
  
  // Badge tone type (different from Text tone)
  const recommendationColor = ((): 'success' | 'info' | 'attention' | 'warning' | 'critical' | undefined => {
    const mapping = {
      strong_accept: 'success' as const,
      accept: 'success' as const,
      neutral: 'attention' as const,
      caution: 'attention' as const,
      reject: 'critical' as const,
    };
    return mapping[forecast?.recommendation || 'neutral'];
  })();
  
  return (
    <Page 
      title={`Counter Offer for #${offer.consumerName}`}
      backAction={{ content: 'Offers', url: `/app/offers/${offer.id}` }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Build Counter Offer</Text>
            
            <Form method="post">
              <FormLayout>
                <Select
                  label="Counter Strategy"
                  name="counter_type"
                  value={counterType}
                  onChange={(val) => setCounterType(val as CounterType)}
                  options={[
                    { label: "Percent Off Order", value: "percent_off_order" },
                    { label: "Price Markdown", value: "price_markdown_order" },
                    { label: "Spend & Save Today", value: "bounceback_current" },
                    { label: "Save On Next Order", value: "bounceback_future" },
                    { label: "Tiered Discount", value: "threshold_two" },
                    { label: "Free Shipping", value: "free_shipping" },
                  ]}
                  helpText={COUNTER_TYPE_DESCRIPTIONS[counterType]}
                />
                
                <TextField
                  label={counterType.includes('percent') ? "Discount Percent" : "Discount Amount ($)"}
                  name="discount_value"
                  type="number"
                  value={discountValue.toString()}
                  onChange={(val) => setDiscountValue(Number(val))}
                  suffix={counterType.includes('percent') ? "%" : "$"}
                  autoComplete="false"
                />
                
                <TextField
                  label="Message to Customer"
                  multiline={4}
                  name="description"
                  placeholder="We'd love to make this work for you..."
                  autoComplete="false"
                />
                
                <TextField
                  label="Internal Notes"
                  multiline={2}
                  name="internal_notes"
                  placeholder="Why this strategy was chosen..."
                  autoComplete="false"
                />
              </FormLayout>
              
              <div style={{ marginTop: "1rem" }}>
                <Button submit variant="primary">Send Counter Offer</Button>
              </div>
            </Form>
          </Card>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <Text variant="headingMd" as="h2">Forecast</Text>
            
            {forecast && (
              <div style={{ marginTop: "1rem" }}>
                <Badge tone={recommendationColor}>
                  {forecast.recommendation.replace('_', ' ').toUpperCase()}
                </Badge>
                
                <div style={{ marginTop: "1rem" }}>
                  <Text variant="headingSm" as="h3">Acceptance Probability</Text>
                  <Text variant="headingLg" as="p" fontWeight="bold">
                    {formatPercent(forecast.acceptanceProbability, 0)}
                  </Text>
                  <Text tone="subdued" variant="bodySm" as="p">
                    Confidence: {formatPercent(forecast.confidenceScore, 0)}
                  </Text>
                </div>
                
                <Divider />
                
                <div style={{ marginTop: "1rem" }}>
                  <Text variant="headingSm" as="h3">Margin Analysis</Text>
                  <LabelledValue
                    label="Original Margin"
                    value={formatUSD(forecast.originalMarginCents / 100)}
                    detail={formatPercent(forecast.originalMarginPercent / 100)}
                  />
                  <LabelledValue
                    label="Est. Margin"
                    value={formatUSD(forecast.estimatedMarginCents / 100)}
                    detail={formatPercent(forecast.estimatedMarginPercent / 100)}
                    tone={forecast.estimatedMarginPercent < 10 ? 'critical' : undefined}
                  />
                  <LabelledValue
                    label="Margin Impact"
                    value={formatUSD(forecast.marginImpactCents / 100)}
                    tone={forecast.marginImpactCents > 5000 ? 'critical' : undefined}
                  />
                </div>
                
                <Divider />
                
                <div style={{ marginTop: "1rem" }}>
                  <Text variant="headingSm" as="h3">Expected Value</Text>
                  <LabelledValue
                    label="Expected Revenue"
                    value={formatUSD(forecast.expectedRevenueCents / 100)}
                  />
                  <LabelledValue
                    label="Expected Margin"
                    value={formatUSD(forecast.expectedMarginCents / 100)}
                  />
                </div>
                
                <Divider />
                
                <div style={{ marginTop: "1rem" }}>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {forecast.reasoningText}
                  </Text>
                </div>
              </div>
            )}
          </Card>
          
          <Card>
            <Text variant="headingMd" as="h2">Customer Context</Text>
            <div style={{ marginTop: "1rem" }}>
              <LabelledValue 
                label="Portfolio" 
                value="New" 
              />
              <LabelledValue 
                label="Lifetime Orders" 
                value={consumerShop12m?.orders || 0} 
              />
              <LabelledValue 
                label="Avg Order Value" 
                value={formatUSD(
                  consumerShop12m?.orders && consumerShop12m.orders > 0
                    ? (consumerShop12m.netSales || 0) / consumerShop12m.orders
                    : 0
                )} 
              />
              <LabelledValue 
                label="Days Since Last" 
                value={
                  consumerShop12m?.lastPurchaseDate 
                    ? Math.floor((Date.now() - new Date(consumerShop12m.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 'Never'
                } 
              />
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
  detail,
  tone
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'base' | 'disabled' | 'inherit' | 'success' | 'critical' | 'caution' | 'subdued' | 'text-inverse' | 'text-inverse-secondary' | 'magic' | 'magic-subdued';
}) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <Text tone="subdued" variant="bodySm" as="p">{label}</Text>
      <Text fontWeight="semibold" tone={tone} as="p">
        {value} {detail && <span style={{ fontSize: "0.9em" }}>({detail})</span>}
      </Text>
    </div>
  );
}
*/