import { InlineStack, BlockStack, TextField, Text, Divider } from "@shopify/polaris";
import * as React from "react";

export type PriceFormValues = {
  cogs: string;
  profitMarkup: string;
  allowanceDiscounts: string;
  allowanceShrink: string;
  allowanceFinancing: string;
  allowanceShipping: string;
  marketAdjustment: string;
  notes?: string;
};

export type PriceFormProps = {
  values: PriceFormValues;
  onChange: (patch: Partial<PriceFormValues>) => void;
  // current store price (for banner) and live computed selling price
  currentPrice?: number;
  sellingPrice: number;
  showPercents?: boolean; // page uses true, drawer can toggle
};

function toNum(v: string | number | null | undefined) {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function pct(part: number, whole: number) {
  if (!whole || whole <= 0) return 0;
  return (part / whole) * 100;
}

export function PriceForm({ values, onChange, sellingPrice, showPercents = true }: PriceFormProps) {
  const Row = (label: keyof PriceFormValues) => {
    const amount = toNum(values[label]);
    const share = pct(amount, sellingPrice);
    return (
      <InlineStack align="space-between" blockAlign="center">
        <TextField
          label={label}
          type="number"
          value={values[label] ?? ""}
          onChange={(v) => onChange({ [label]: v })}
          autoComplete="off"
          prefix="$"
          min={0}
          step={0.1}
        />
        {label !== "notes" && (
          <Text tone="subdued" as="span" variant="bodySm">
            {showPercents ? (sellingPrice > 0 ? `(${share.toFixed(2)}%)` : "(—)") : null}
          </Text>
        )}
      </InlineStack>
    );
  };

  const totalAllowancesPlusMarket = (
    toNum(values.allowanceDiscounts) +
    toNum(values.allowanceShrink) +
    toNum(values.allowanceFinancing) +
    toNum(values.allowanceShipping) +
    toNum(values.marketAdjustment)
  ).toFixed(2);

  return (
    <BlockStack gap="300">
      {Row("cogs")}
      {Row("profitMarkup")}
      {Row("allowanceShrink")}
      {Row("allowanceFinancing")}
      {Row("allowanceDiscounts")}
      {Row("allowanceShipping")}
      {Row("marketAdjustment")}

      <Divider />

      <InlineStack align="space-between">
        <Text as="p">
          Total Allowances + Market Adj: <b>${totalAllowancesPlusMarket}</b>
        </Text>
        <Text as="p">
          Selling Price: <b>${sellingPrice.toFixed(2)}</b> (100%)
        </Text>
      </InlineStack>

      <TextField
        label="Notes"
        value={values.notes ?? ""}
        onChange={(v) => onChange({ notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </BlockStack>
  );
}
