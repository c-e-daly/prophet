// app/components/counterConfigs/PriceMarkdownOrderConfig.tsx

import { TextField, Card, Text as PolarisText, InlineStack } from "@shopify/polaris";
import type { PriceMarkdownOrderConfig as PriceMarkdownOrderConfigType } from "../../lib/types/counterTypes";
import type { CounterConfigComponentProps } from "../../routes/app.offers.counter.$id";

export function PriceMarkdownOrderConfig({ 
  value, 
  onChange, 
  offer, 
  cart 
}: CounterConfigComponentProps) {
  const config = value as PriceMarkdownOrderConfigType;
  
  const cartTotal = cart?.cartTotal || 0;
  const discountAmount = config.markdown_cents;
  const newTotal = Math.max(0, cartTotal - discountAmount);
  const discountPercent = cartTotal > 0 ? (discountAmount / cartTotal * 100) : 0;
  const marginPercent = cart?.totalCOGS ? ((newTotal - cart.totalCOGS) / newTotal * 100) : 0;
  
  return (
    <div>
      <TextField
        label="Markdown Amount"
        type="number"
        value={(config.markdown_cents / 100).toString()}
        onChange={(val) => {
          const markdown_cents = Math.max(0, Math.round(Number(val) * 100));
          onChange({
            ...config,
            markdown_cents,
          });
        }}
        prefix="$"
        helpText="Fixed dollar amount to reduce from order total"
        autoComplete="off"
        step={0.01}
      />
      
      {/* Impact Analysis */}
      <div style={{ marginTop: "1rem" }}>
        <Card>
          <PolarisText variant="headingSm" as="h3">Markdown Impact</PolarisText>
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">Original Cart Total:</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold">
                ${(cartTotal / 100).toFixed(2)}
              </PolarisText>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">Markdown Amount:</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold" tone="critical">
                -${(discountAmount / 100).toFixed(2)}
              </PolarisText>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">Discount Percentage:</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold">
                {discountPercent.toFixed(1)}%
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
              ${(discountAmount / 100).toFixed(2)} Off Your Order!
            </PolarisText>
            <PolarisText variant="bodyMd" as="p" tone="subdued">
              We'll take ${(discountAmount / 100).toFixed(2)} off your order total
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
      {discountAmount >= cartTotal && (
        <div style={{ marginTop: "1rem" }}>
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <PolarisText variant="bodySm" as="span" tone="critical" fontWeight="semibold">
                🚨 Invalid Markdown
              </PolarisText>
            </InlineStack>
            <PolarisText variant="bodySm" as="p" tone="subdued">
              Markdown amount cannot be greater than or equal to cart total. Maximum allowed: ${(cartTotal / 100).toFixed(2)}
            </PolarisText>
          </Card>
        </div>
      )}
      
      {discountPercent > 30 && discountAmount < cartTotal && (
        <div style={{ marginTop: "1rem" }}>
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <PolarisText variant="bodySm" as="span" tone="caution" fontWeight="semibold">
                ⚠️ High Discount Warning
              </PolarisText>
            </InlineStack>
            <PolarisText variant="bodySm" as="p" tone="subdued">
              This markdown is {discountPercent.toFixed(1)}% of the cart value. Consider if this aligns with your margin goals.
            </PolarisText>
          </Card>
        </div>
      )}
      
      {marginPercent < 5 && cart?.totalCOGS && newTotal > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <PolarisText variant="bodySm" as="span" tone="critical" fontWeight="semibold">
                🚨 Low Margin Alert
              </PolarisText>
            </InlineStack>
            <PolarisText variant="bodySm" as="p" tone="subdued">
              This markdown results in a margin below 5%. Consider reducing the markdown amount.
            </PolarisText>
          </Card>
        </div>
      )}
    </div>
  );
}