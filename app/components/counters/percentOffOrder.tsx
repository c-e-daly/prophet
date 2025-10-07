// app/components/counterConfigs/PercentOffOrderConfig.tsx

import { TextField, Card, Text as PolarisText, InlineStack } from "@shopify/polaris";
import type { PercentOffOrderConfig as PercentOffOrderConfigType } from "../../lib/types/counterTypes";
import type { CounterConfigComponentProps } from "../../routes/app.offers.counter.$id";

export function PercentOffOrderConfig({ 
  value, 
  onChange, 
  offer, 
  cart 
}: CounterConfigComponentProps) {
  const config = value as PercentOffOrderConfigType;
  
  const cartTotal = cart?.cartTotal || 0;
  const discountAmount = Math.round(cartTotal * (config.percent / 100));
  const newTotal = cartTotal - discountAmount;
  const marginPercent = cart?.totalCOGS ? ((newTotal - cart.totalCOGS) / newTotal * 100) : 0;
  
  return (
    <div>
      <TextField
        label="Discount Percentage"
        type="number"
        value={config.percent.toString()}
        onChange={(val) => {
          const percent = Math.max(0, Math.min(100, Number(val))); // Clamp between 0-100
          onChange({
            ...config,
            percent,
          });
        }}
        suffix="%"
        helpText="Percentage discount applied to entire order (0-100%)"
        min="0"
        max="100"
        autoComplete="off"
      />
      
      {/* Impact Analysis */}
      <div style={{ marginTop: "1rem" }}>
        <Card>
          <PolarisText variant="headingSm" as="h3">Discount Impact</PolarisText>
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">Original Cart Total:</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold">
                ${(cartTotal / 100).toFixed(2)}
              </PolarisText>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">Discount ({config.percent}%):</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold" tone="critical">
                -${(discountAmount / 100).toFixed(2)}
              </PolarisText>
            </div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              paddingTop: "0.5rem", 
              borderTop: "1px solid #e1e3e5" 
            }}>
              <PolarisText variant="bodyMd" as="p" fontWeight="semibold">New Cart Total:</PolarisText>
              <PolarisText variant="bodyMd" as="p" fontWeight="semibold" tone="success">
                ${(newTotal / 100).toFixed(2)}
              </PolarisText>
            </div>
            {cart?.totalCOGS && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginTop: "0.5rem",
                paddingTop: "0.5rem",
                borderTop: "1px solid #e1e3e5"
              }}>
                <PolarisText variant="bodySm" as="span" tone="subdued">Estimated Margin:</PolarisText>
                <PolarisText 
                  variant="bodySm"
                  as="span"
                  fontWeight="semibold"
                  tone={marginPercent < 10 ? "critical" : marginPercent < 20 ? "caution" : "success"}
                >
                  {marginPercent.toFixed(1)}%
                </PolarisText>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Customer Preview */}
      <div style={{ marginTop: "1rem" }}>
        <Card>
          <PolarisText variant="headingSm" as="h3">Customer Sees:</PolarisText>
          <div style={{ 
            marginTop: "0.5rem", 
            padding: "1rem", 
            background: "#f6f6f7", 
            borderRadius: "8px",
            border: "2px dashed #c4cdd5"
          }}>
            <PolarisText variant="headingMd" as="p" fontWeight="bold">
              {config.percent}% Off Your Entire Order!
            </PolarisText>
            <PolarisText variant="bodyMd" as="p" tone="subdued">
              Save ${(discountAmount / 100).toFixed(2)} on your order of ${(cartTotal / 100).toFixed(2)}
            </PolarisText>
            <div style={{ marginTop: "0.5rem" }}>
              <PolarisText variant="headingLg" as="p" fontWeight="bold" tone="success">
                Pay just ${(newTotal / 100).toFixed(2)}
              </PolarisText>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Warnings */}
      {config.percent > 30 && (
        <div style={{ marginTop: "1rem" }}>
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <PolarisText variant="bodySm" as="span" tone="caution" fontWeight="semibold">
                ⚠️ High Discount Warning
              </PolarisText>
            </InlineStack>
            <PolarisText variant="bodySm" as="p" tone="subdued">
              Discounts over 30% may significantly impact margins. Consider alternatives like bounceback offers.
            </PolarisText>
          </Card>
        </div>
      )}
      
      {marginPercent < 5 && cart?.totalCOGS && (
        <div style={{ marginTop: "1rem" }}>
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <PolarisText variant="bodySm" as="span" tone="critical" fontWeight="semibold">
                🚨 Low Margin Alert
              </PolarisText>
            </InlineStack>
            <PolarisText variant="bodySm" as="p" tone="subdued">
              This discount results in a margin below 5%. Consider reducing the discount or using a different strategy.
            </PolarisText>
          </Card>
        </div>
      )}
    </div>
  );
}