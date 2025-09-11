// app/components/pricebuilder/BulkEditor.tsx
import * as React from "react";
import { useState } from "react";
import { Card, BlockStack, InlineGrid, TextField, Button, Text } from "@shopify/polaris";

/**
 * What a row looks like in your bulk list.
 * Adjust to match your real shape if you have different field names.
 */
export type PriceBuilderRow = {
  id: string | number;
  variantGID: string;
  variantName: string;
  productGID: string;
  cogs?: number | null;
  price?: number | null;
  sellingPrice?: number | null;
  // Per-row allowance / markup fields (if you need them during preview)
  profitMarkupPct?: number | null;
  allowanceDiscountsPct?: number | null;
  allowanceShrinkPct?: number | null;
  allowanceFinancingPct?: number | null;
  allowanceShippingPct?: number | null;
  // anything else you rely on inside the component...
};

type BulkForm = {
  profitMarkupPct: string;         // as text inputs; parsed later
  allowanceDiscountsPct: string;
  allowanceShrinkPct: string;
  allowanceFinancingPct: string;
  allowanceShippingPct: string;
};

type BulkField = keyof BulkForm;

export type BulkApplyPayload = {
  fieldValues: {
    profitMarkupPct?: number;
    allowanceDiscountsPct?: number;
    allowanceShrinkPct?: number;
    allowanceFinancingPct?: number;
    allowanceShippingPct?: number;
  };
  affectedRowIds: Array<PriceBuilderRow["id"]>;
};

type BulkEditorProps = {
  selected: PriceBuilderRow[];
  onApply: (payload: BulkApplyPayload) => void;
  applying?: boolean;
};

export default function BulkEditor({ selected, onApply, applying }: BulkEditorProps) {
  const [form, setForm] = useState<BulkForm>({
    profitMarkupPct: "",
    allowanceDiscountsPct: "",
    allowanceShrinkPct: "",
    allowanceFinancingPct: "",
    allowanceShippingPct: "",
  });

  // Example: show a preview count and a quick “avg selling price” for context
  const selectedCount = selected.length;
  const avgSellingPrice = React.useMemo(() => {
    if (!selectedCount) return 0;
    const sum = selected.reduce((acc: number, row: PriceBuilderRow) => acc + (row.sellingPrice ?? 0), 0);
    return sum / selectedCount;
  }, [selected, selectedCount]);

  const handleChange =
    (field: BulkField) =>
    (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const parsePct = (v: string): number | undefined => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleApply = () => {
    const fieldValues = {
      profitMarkupPct: parsePct(form.profitMarkupPct),
      allowanceDiscountsPct: parsePct(form.allowanceDiscountsPct),
      allowanceShrinkPct: parsePct(form.allowanceShrinkPct),
      allowanceFinancingPct: parsePct(form.allowanceFinancingPct),
      allowanceShippingPct: parsePct(form.allowanceShippingPct),
    };

    // strip undefined entries so you only apply what the user set
    const cleaned = Object.fromEntries(
      Object.entries(fieldValues).filter(([, v]) => typeof v === "number")
    ) as BulkApplyPayload["fieldValues"];

    onApply({
      fieldValues: cleaned,
      affectedRowIds: selected.map((r: PriceBuilderRow) => r.id),
    });
  };

  const disabled = applying || selectedCount === 0;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          <TextField
            label="Profit markup %"
            value={form.profitMarkupPct}
            onChange={handleChange("profitMarkupPct")}
            autoComplete="off"
            suffix="%"
            inputMode="decimal"
          />
          <TextField
            label="Allowance: Discounts %"
            value={form.allowanceDiscountsPct}
            onChange={handleChange("allowanceDiscountsPct")}
            autoComplete="off"
            suffix="%"
            inputMode="decimal"
          />
          <TextField
            label="Allowance: Shrink %"
            value={form.allowanceShrinkPct}
            onChange={handleChange("allowanceShrinkPct")}
            autoComplete="off"
            suffix="%"
            inputMode="decimal"
          />
          <TextField
            label="Allowance: Financing %"
            value={form.allowanceFinancingPct}
            onChange={handleChange("allowanceFinancingPct")}
            autoComplete="off"
            suffix="%"
            inputMode="decimal"
          />
          <TextField
            label="Allowance: Shipping %"
            value={form.allowanceShippingPct}
            onChange={handleChange("allowanceShippingPct")}
            autoComplete="off"
            suffix="%"
            inputMode="decimal"
          />
        </InlineGrid>

        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            {selectedCount} variant{selectedCount === 1 ? "" : "s"} selected · Avg selling price ≈{" "}
            {avgSellingPrice.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </Text>
          <Button variant="primary" disabled={disabled} onClick={handleApply} loading={!!applying}>
            {`Apply to ${selectedCount} item${selectedCount === 1 ? "" : "s"}`}
          </Button>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
