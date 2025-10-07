// app/components/counterConfigs/ThresholdTwoConfig.tsx
import { useState } from "react";
import { TextField, Button, Card, Text as PolarisText } from "@shopify/polaris";
import type { ThresholdTwoConfig } from "../../lib/types/counterTypes";
import type { CounterConfigComponentProps } from "../../routes/app.offers.counter.$id";

export function ThresholdTwoConfig({ 
  value, 
  onChange, 
  offer, 
  cart 
}: CounterConfigComponentProps) {
  const config = value as ThresholdTwoConfig;
  
  return (
    <div>
      <PolarisText variant="headingSm" as="h3">Spending Thresholds</PolarisText>
      <PolarisText variant="bodySm" as="p" tone="subdued">
        Create multiple tiers - the more they spend, the more they save
      </PolarisText>
      
      {config.thresholds.map((threshold, index) => (
        <Card key={index}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Minimum Spend"
                type="number"
                value={(threshold.min_spend_cents / 100).toString()}
                onChange={(val) => {
                  const newThresholds = [...config.thresholds];
                  newThresholds[index] = {
                    ...threshold,
                    min_spend_cents: Math.round(Number(val) * 100),
                  };
                  onChange({ ...config, thresholds: newThresholds });
                }}
                prefix="$"
                autoComplete="off"
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <TextField
                label="Discount Percent"
                type="number"
                value={threshold.discount_percent.toString()}
                onChange={(val) => {
                  const newThresholds = [...config.thresholds];
                  newThresholds[index] = {
                    ...threshold,
                    discount_percent: Number(val),
                  };
                  onChange({ ...config, thresholds: newThresholds });
                }}
                suffix="%"
                autoComplete="off"
              />
            </div>
            
            <Button 
             tone="critical" 
              onClick={() => {
                const newThresholds = config.thresholds.filter((_, i) => i !== index);
                onChange({ ...config, thresholds: newThresholds });
              }}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      
      <Button onClick={() => {
        const newThresholds = [
          ...config.thresholds,
          { min_spend_cents: 0, discount_percent: 10 }
        ];
        onChange({ ...config, thresholds: newThresholds });
      }}>
        Add Tier
      </Button>
      
      {/* Preview */}
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
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {config.thresholds
                .sort((a, b) => a.min_spend_cents - b.min_spend_cents)
                .map((t, i) => (
                  <li key={i}>
                    <PolarisText variant="bodyMd" as="span">
                      Spend ${(t.min_spend_cents / 100).toFixed(2)}+ → Save {t.discount_percent}%
                    </PolarisText>
                  </li>
                ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}