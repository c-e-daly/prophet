// app/components/counterConfigs/FreeShippingConfig.tsx

import { Card, Text as PolarisText, Banner } from "@shopify/polaris";
import type { FreeShippingConfig as FreeShippingConfigType } from "../../lib/types/counterTypes";
import type { CounterConfigComponentProps } from "../../routes/app.offers.counter.$id";

export function FreeShippingConfig({ 
  value, 
  onChange, 
  offer, 
  cart 
}: CounterConfigComponentProps) {
  const config = value as FreeShippingConfigType;
  
  const currentShipping = cart?.shippingTotal || 0;
  const savings = currentShipping;
  
  return (
    <div>
      <Banner tone="info">
        <p>Free shipping has no additional configuration. Customer will not be charged for shipping.</p>
      </Banner>
      
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
              <PolarisText variant="bodySm" as="span" fontWeight="semibold" tone="success">
                FREE
              </PolarisText>
            </div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              paddingTop: "0.5rem", 
              borderTop: "1px solid #e1e3e5" 
            }}>
              <PolarisText variant="bodyMd" as="p" fontWeight="semibold">Customer Saves:</PolarisText>
              <PolarisText variant="bodyMd" as="p" fontWeight="semibold" tone="success">
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
              🎉 Free Shipping!
            </PolarisText>
            <PolarisText variant="bodyMd" as="p" tone="subdued">
              We'll cover all shipping costs for this order.
            </PolarisText>
          </div>
        </Card>
      </div>
    </div>
  );
}