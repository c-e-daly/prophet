// app/routes/app.offers.$id.counter.tsx
import { useState, useEffect } from "react";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { Card, Select, TextField, Button, Badge, Text } from "@shopify/polaris";
import { calculateExpectedValue } from "~/lib/calculations/counterofferForecasting";
import { formatCurrencyUSD, formatPercent } from "../utils/format";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server"
import { COUNTER_TYPE_LABELS } from "../lib/types/counterTypeLabels";

export default function CounterOfferBuilder() {
  const { request } = useLoaderData<typeof loader>();
  const { shopsID, currentUserId, session } = await getAuthContext(request);

  const [counterType, setCounterType] = useState<CounterType>('percent_off_order');
  const [discountValue, setDiscountValue] = useState(15);
  const [forecast, setForecast] = useState<ForecastOutput | null>(null);

  // Recalculate forecast whenever inputs change
  useEffect(() => {
    const config = buildCounterConfig(counterType, discountValue);
    const input: ForecastInput = {
      cartTotalCents: cart.cartTotal,
      cartCostsCents: cart.totalCOGS || 0,
      shippingRevenueCents: cart.shippingTotal || 0,
      shippingCostCents: cart.shippingCost || 0,
      counterType,
      counterConfig: config,
      customerPortfolio: portfolio.current_portfolio,
      customerLifetimeOrders: consumer.lifetimeOrders || 0,
      customerAvgOrderValue: consumer.avgOrderValue || 0,
      daysSinceLastOrder: consumer.daysSinceLastOrder || 999,
      similarCountersAccepted: 0, // Load from history
      similarCountersTotal: 0,
    };

    const result = calculateExpectedValue(input);
    setForecast(result);
  }, [counterType, discountValue]);

  const recommendationColor = {
    strong_accept: 'success',
    accept: 'success',
    neutral: 'warning',
    caution: 'warning',
    reject: 'critical',
  }[forecast?.recommendation || 'neutral'];

  return (
    <Page title={`Counter Offer #${offer.id}`}>
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Build Counter Offer</Text>

            <Form method="post">
              <FormLayout>
                <Select
                  label="Counter Strategy"
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
                  label={counterType.includes('percent') ? "Discount Percent" : "Discount Amount"}
                  type="number"
                  value={discountValue.toString()}
                  onChange={(val) => setDiscountValue(Number(val))}
                  suffix={counterType.includes('percent') ? "%" : "$"}
                />

                <TextField
                  label="Message to Customer"
                  multiline={4}
                  name="description"
                  placeholder="We'd love to make this work for you..."
                />

                <TextField
                  label="Internal Notes"
                  multiline={2}
                  name="internal_notes"
                  placeholder="Why this strategy was chosen..."
                />
              </FormLayout>

              <div style={{ marginTop: "1rem" }}>
                <Button submit primary>Send Counter Offer</Button>
              </div>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          {/* Live Forecast Panel */}
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
                    value={formatCurrencyUSD(forecast.originalMarginCents)}
                    detail={formatPercent(forecast.originalMarginPercent / 100)}
                  />
                  <LabelledValue
                    label="Est. Margin"
                    value={formatCurrencyUSD(forecast.estimatedMarginCents)}
                    detail={formatPercent(forecast.estimatedMarginPercent / 100)}
                    tone={forecast.estimatedMarginPercent < 10 ? 'critical' : 'success'}
                  />
                  <LabelledValue
                    label="Margin Impact"
                    value={formatCurrencyUSD(forecast.marginImpactCents)}
                    tone={forecast.marginImpactCents > 5000 ? 'warning' : 'subdued'}
                  />
                </div>

                <Divider />

                <div style={{ marginTop: "1rem" }}>
                  <Text variant="headingSm" as="h3">Expected Value</Text>
                  <LabelledValue
                    label="Expected Revenue"
                    value={formatCurrencyUSD(forecast.expectedRevenueCents)}
                  />
                  <LabelledValue
                    label="Expected Margin"
                    value={formatCurrencyUSD(forecast.expectedMarginCents)}
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

          {/* Customer Context */}
          <Card>
            <Text variant="headingMd" as="h2">Customer Context</Text>
            <div style={{ marginTop: "1rem" }}>
              <LabelledValue label="Portfolio" value={portfolio.current_portfolio} />
              <LabelledValue label="Lifetime Orders" value={consumer.lifetimeOrders} />
              <LabelledValue label="Avg Order Value" value={formatCurrencyUSD(consumer.avgOrderValue)} />
              <LabelledValue label="Days Since Last" value={consumer.daysSinceLastOrder} />
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