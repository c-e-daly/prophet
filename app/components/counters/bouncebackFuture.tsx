// app/components/counterConfigs/BouncebackFutureConfig.tsx

import { TextField, Select, Card, Text as PolarisText } from "@shopify/polaris";
import type { BouncebackFutureConfig as BouncebackFutureConfigType } from "../../lib/types/counterTypes";
import type { CounterConfigComponentProps } from "../../routes/app.offers.counter.$id";

export function BouncebackFutureConfig({ 
  value, 
  onChange, 
  offer, 
  cart 
}: CounterConfigComponentProps) {
  const config = value as BouncebackFutureConfigType;
  
  return (
    <div>
      <TextField
        label="Next Order Minimum Spend"
        type="number"
        value={(config.next_order_threshold_cents / 100).toString()}
        onChange={(val) => {
          onChange({
            ...config,
            next_order_threshold_cents: Math.round(Number(val) * 100),
          });
        }}
        prefix="$"
        helpText="Customer must spend this much on their next order"
        autoComplete="off"
      />
      
      <TextField
        label="Discount on Next Order"
        type="number"
        value={(config.reward_cents / 100).toString()}
        onChange={(val) => {
          onChange({
            ...config,
            reward_cents: Math.round(Number(val) * 100),
          });
        }}
        prefix="$"
        helpText="They'll get this much off their next qualifying order"
        autoComplete="off"
      />
      
      <TextField
        label="Valid For (Days)"
        type="number"
        value={config.validity_days.toString()}
        onChange={(val) => {
          onChange({
            ...config,
            validity_days: Number(val),
          });
        }}
        helpText="Number of days they have to redeem"
        autoComplete="off"
      />
      
      <Select
        label="Start Date"
        value={config.from_date}
        onChange={(val) => {
          onChange({
            ...config,
            from_date: val as "order_date" | "counter_accepted",
          });
        }}
        options={[
          { label: "From Order Date", value: "order_date" },
          { label: "From Counter Accept Date", value: "counter_accepted" },
        ]}
      />
      
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
            <PolarisText as="h3" variant="headingMd" fontWeight="bold">
              Special Future Reward!
            </PolarisText>
            <PolarisText as="p" variant="bodyMd" tone="subdued">
              Accept this counter offer and get <strong>${(config.reward_cents / 100).toFixed(2)}</strong> off 
              your next order of <strong>${(config.next_order_threshold_cents / 100).toFixed(2)}</strong> or more 
              within the next <strong>{config.validity_days} days</strong>!
            </PolarisText>
            <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e1e3e5" }}>
              <PolarisText as="p" variant="bodySm" tone="subdued">
                Reward starts: {config.from_date === "order_date" ? "When order is placed" : "When counter is accepted"}
              </PolarisText>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}