// app/routes/app.offers.$id.counter.tsx
import { useState, useEffect } from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { Page, Card, Layout, Select, FormLayout,TextField, Button, Badge, Text, Divider} from "@shopify/polaris";
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
      return { type: 'price_markdown_order', markdown_cents: value * 100, apply_to: 'order' };
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
  
  return redirect(`/app/offers/${offersID}`);
};

export default function CounterOfferBuilder() {
  const { offer, consumerShop12m, math, lineItems } = useLoaderData<typeof loader>();
  
  const [counterType, setCounterType] = useState<CounterType>('percent_off_order');
  const [discountValue, setDiscountValue] = useState(15);
  const [forecast, setForecast] = useState<ForecastOutput | null>(null);
  
  // Calculate forecast whenever inputs change
  useEffect(() => {
    const config = buildCounterConfig(counterType, discountValue);
    
    // Calculate COGS from line items
    const totalCOGS = lineItems
      .filter(item => item.status === 'Settle')
      .reduce((sum, item) => sum + (item.cogs * item.qty), 0);
    
    const input: ForecastInput = {
      cartTotalCents: (offer.carts?.cartTotalPrice || 0) * 100,
      cartCostsCents: totalCOGS * 100,
      shippingRevenueCents: (offer.carts?.shippingTotal || 0) * 100,
      shippingCostCents: 0, // TODO: Add shipping cost to data model
      counterType,
      counterConfig: config,
      customerPortfolio: consumerShop12m?.current_portfolio || 'new',
      customerLifetimeOrders: consumerShop12m?.lifetimeOrders || 0,
      customerAvgOrderValue: (consumerShop12m?.avgOrderValue || 0) * 100,
      daysSinceLastOrder: consumerShop12m?.daysSinceLastOrder || 999,
      historicalAcceptanceRate: undefined,
      similarCountersAccepted: 0,
      similarCountersTotal: 0,
    };
    
    const result = calculateExpectedValue(input);
    setForecast(result);
  }, [counterType, discountValue, offer, math, consumerShop12m, lineItems]);
  
  const recommendationColor = {
    strong_accept: 'success',
    accept: 'success',
    neutral: 'warning',
    caution: 'warning',
    reject: 'critical',
  }[forecast?.recommendation || 'neutral'];
  
  return (
    <Page 
      title={`Counter Offer for #${offer.id}`}
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
                  <Text tone="subdued" variant="bodySm">
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
                    tone={forecast.estimatedMarginPercent < 10 ? 'critical' : 'success'}
                  />
                  <LabelledValue
                    label="Margin Impact"
                    value={formatUSD(forecast.marginImpactCents / 100)}
                    tone={forecast.marginImpactCents > 5000 ? 'warning' : 'subdued'}
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
                  <Text variant="bodySm" tone="subdued">
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
                value={consumerShop12m?.current_portfolio || 'Unknown'} 
              />
              <LabelledValue 
                label="Lifetime Orders" 
                value={consumerShop12m?.lifetimeOrders || 0} 
              />
              <LabelledValue 
                label="Avg Order Value" 
                value={formatUSD(consumerShop12m?.avgOrderValue || 0)} 
              />
              <LabelledValue 
                label="Days Since Last" 
                value={consumerShop12m?.daysSinceLastOrder || 'N/A'} 
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
  tone?: 'success' | 'warning' | 'critical' | 'subdued';
}) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <Text tone="subdued" variant="bodySm">{label}</Text>
      <Text fontWeight="semibold" tone={tone}>
        {value} {detail && <span style={{ fontSize: "0.9em" }}>({detail})</span>}
      </Text>
    </div>
  );
}