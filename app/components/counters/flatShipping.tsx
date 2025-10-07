// app/components/counterConfigs/FlatShippingConfig.tsx

import { TextField, Card, Text as PolarisText } from "@shopify/polaris";
import type { FlatShippingConfig } from "../../lib/types/counterTypes";
import type { CounterConfigComponentProps } from "../../routes/app.offers.counter.$id";

export function FlatShippingConfig({ 
  value, 
  onChange, 
  offer, 
  cart 
}: CounterConfigComponentProps) {
  const config = value as FlatShippingConfig;
  
  const currentShipping = cart?.shippingTotal || 0;
  const savings = currentShipping - config.shipping_cost_cents;
  
  return (
    <div>
      <TextField
        label="Flat Shipping Cost"
        type="number"
        value={(config.shipping_cost_cents / 100).toString()}
        onChange={(val) => {
          onChange({
            ...config,
            shipping_cost_cents: Math.round(Number(val) * 100),
          });
        }}
        prefix="$"
        helpText="Customer will pay this flat rate for shipping"
        autoComplete="off"
      />
      
      {/* Preview */}
      <div style={{ marginTop: "1rem" }}>
        <Card>
          <PolarisText variant="headingSm" as="h3">Shipping Details</PolarisText>
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">Current Shipping:</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold">
                ${(currentShipping / 100).toFixed(2)}
              </PolarisText>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <PolarisText variant="bodySm" as="span" tone="subdued">New Shipping:</PolarisText>
              <PolarisText variant="bodySm" as="span" fontWeight="semibold">
                ${(config.shipping_cost_cents / 100).toFixed(2)}
              </PolarisText>
            </div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              paddingTop: "0.5rem", 
              borderTop: "1px solid #e1e3e5" 
            }}>
              <PolarisText variant="bodyMd" as="p" fontWeight="semibold">Customer Saves:</PolarisText>
              <PolarisText 
                variant="bodyMd" 
                as="p"
                fontWeight="semibold" 
                tone={savings > 0 ? "success" : "subdued"}
              >
                ${(savings / 100).toFixed(2)}
              </PolarisText>
            </div>
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
              Flat Rate Shipping: ${(config.shipping_cost_cents / 100).toFixed(2)}
            </PolarisText>
            <PolarisText variant="bodyMd" as="p" tone="subdued">
              Ship your order for just ${(config.shipping_cost_cents / 100).toFixed(2)}
            </PolarisText>
            {savings > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                <PolarisText variant="bodySm" as="p" tone="success" fontWeight="semibold">
                  You save ${(savings / 100).toFixed(2)} on shipping!
                </PolarisText>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}