// app/components/pricebuilder/BulkEditor.tsx
import { useState, useMemo, useCallback } from "react";
import { Modal, Layout, Card, Box, BlockStack, Text, TextField, Button,
  InlineStack, IndexTable,Badge, InlineGrid,RadioButton, Divider} from "@shopify/polaris";
import type { VPView } from "../../routes/app.pricebuilder._index";
import { formatCurrencyUSD, formatPercent } from "../../utils/format";

interface BulkEditorProps {
  variants: VPView[];
  onClose: () => void;
  onSave: (batch: any[]) => void;
  onPublish: (batch: any[]) => void;
}



type BulkOperation = 'percentage' | 'fixed' | 'formula';

export function BulkEditor({ variants, onClose, onSave, onPublish }: BulkEditorProps) {
  const [operation, setOperation] = useState<BulkOperation>('percentage');
  const [percentageMarkup, setPercentageMarkup] = useState("0");
  const [fixedAmount, setFixedAmount] = useState("0");
  const [profitMarkupPercent, setProfitMarkupPercent] = useState("20");
  const [allowanceDiscountsPercent, setAllowanceDiscountsPercent] = useState("5");
  const [allowanceShrinkPercent, setAllowanceShrinkPercent] = useState("2");
  const [allowanceFinancingPercent, setAllowanceFinancingPercent] = useState("3");
  const [allowanceShippingPercent, setAllowanceShippingPercent] = useState("5");
  const [marketAdjustmentPercent, setMarketAdjustmentPercent] = useState("0");
  const [notes, setNotes] = useState("");

  // Helper to convert string to number
  const toNum = (v: string | number | null | undefined) => {
    const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  // Calculate new prices for all variants
  const computedVariants = useMemo(() => {
    return variants.map(variant => {
      const currentCogs = variant.cogs || 0;
      
      let newCogs = currentCogs;
      let newProfitMarkup = 0;
      let newAllowanceDiscounts = 0;
      let newAllowanceShrink = 0;
      let newAllowanceFinancing = 0;
      let newAllowanceShipping = 0;
      let newMarketAdjustment = 0;

      if (operation === 'percentage') {
        // Apply percentage markup to current selling price
        const currentSellingPrice = variant.sellingPrice || currentCogs;
        const markup = (toNum(percentageMarkup) / 100) * currentSellingPrice;
        const newSellingPrice = currentSellingPrice + markup;
        
        // Distribute the new price maintaining COGS, adjusting profit markup
        newProfitMarkup = Math.max(0, newSellingPrice - currentCogs - 
          (variant.allowanceDiscounts || 0) - (variant.allowanceShrink || 0) - 
          (variant.allowanceFinance || 0) - (variant.allowanceShipping || 0) - 
          (variant.marketAdjustment || 0));
        
        newAllowanceDiscounts = variant.allowanceDiscounts || 0;
        newAllowanceShrink = variant.allowanceShrink || 0;
        newAllowanceFinancing = variant.allowanceFinance || 0;
        newAllowanceShipping = variant.allowanceShipping || 0;
        newMarketAdjustment = variant.marketAdjustment || 0;
        
      } else if (operation === 'fixed') {
        // Add fixed amount to profit markup
        newProfitMarkup = (variant.profitMarkup || 0) + toNum(fixedAmount);
        newAllowanceDiscounts = variant.allowanceDiscounts || 0;
        newAllowanceShrink = variant.allowanceShrink || 0;
        newAllowanceFinancing = variant.allowanceFinance || 0;
        newAllowanceShipping = variant.allowanceShipping || 0;
        newMarketAdjustment = variant.marketAdjustment || 0;
        
      } else if (operation === 'formula') {
        // Calculate based on percentages of COGS
        newProfitMarkup = currentCogs * (toNum(profitMarkupPercent) / 100);
        newAllowanceDiscounts = currentCogs * (toNum(allowanceDiscountsPercent) / 100);
        newAllowanceShrink = currentCogs * (toNum(allowanceShrinkPercent) / 100);
        newAllowanceFinancing = currentCogs * (toNum(allowanceFinancingPercent) / 100);
        newAllowanceShipping = currentCogs * (toNum(allowanceShippingPercent) / 100);
        newMarketAdjustment = currentCogs * (toNum(marketAdjustmentPercent) / 100);
      }

      const newSellingPrice = newCogs + newProfitMarkup + newAllowanceDiscounts + 
        newAllowanceShrink + newAllowanceFinancing + newAllowanceShipping + newMarketAdjustment;

      const oldSellingPrice = variant.sellingPrice || 0;
      const priceChange = newSellingPrice - oldSellingPrice;
      const priceChangePercent = oldSellingPrice > 0 ? (priceChange / oldSellingPrice) * 100 : 0;

      return {
        ...variant,
        newCogs,
        newProfitMarkup,
        newAllowanceDiscounts,
        newAllowanceShrink,
        newAllowanceFinancing,
        newAllowanceShipping,
        newMarketAdjustment,
        newSellingPrice,
        priceChange,
        priceChangePercent,
      };
    });
  }, [
    variants, 
    operation, 
    percentageMarkup, 
    fixedAmount, 
    profitMarkupPercent,
    allowanceDiscountsPercent,
    allowanceShrinkPercent,
    allowanceFinancingPercent,
    allowanceShippingPercent,
    marketAdjustmentPercent
  ]);

  // Handle save
  const handleSave = useCallback(() => {
    const batch = computedVariants.map(variant => ({
      variantsGID: variant.variantGID,
      shops: variant.shops,
      cogs: variant.newCogs,
      profitMarkup: variant.newProfitMarkup,
      allowanceDiscounts: variant.newAllowanceDiscounts,
      allowanceShrink: variant.newAllowanceShrink,
      allowanceFinancing: variant.newAllowanceFinancing,
      allowanceShipping: variant.newAllowanceShipping,
      marketAdjustment: variant.newMarketAdjustment,
      sellingPrice: variant.newSellingPrice,
      notes: notes || null,
      modifiedDate: new Date().toISOString(),
    }));
    
    onSave(batch);
  }, [computedVariants, notes, onSave]);

  // Handle publish
  const handlePublish = useCallback(() => {
    const batch = computedVariants.map(variant => ({
      variantsGID: variant.variantGID,
      shops: variant.shops,
      cogs: variant.newCogs,
      profitMarkup: variant.newProfitMarkup,
      allowanceDiscounts: variant.newAllowanceDiscounts,
      allowanceShrink: variant.newAllowanceShrink,
      allowanceFinancing: variant.newAllowanceFinancing,
      allowanceShipping: variant.newAllowanceShipping,
      marketAdjustment: variant.newMarketAdjustment,
      sellingPrice: variant.newSellingPrice,
      notes: notes || null,
      modifiedDate: new Date().toISOString(),
    }));
    
    onPublish(batch);
  }, [computedVariants, notes, onPublish]);

  /* Table headers and data
  const resourceName = {
    singular: 'variant',
    plural: 'variants',
  };

  const headings = [
    { title: 'Product' },
    { title: 'Current Price' },
    { title: 'New Price' },
    { title: 'Change' },
    { title: 'New Margin' },
  ];*/

type Heading = { title: string; alignment?: 'start' | 'center' | 'end' };

const headings: [Heading, ...Heading[]] = [
  { title: 'Variant' },
  { title: 'COGS', alignment: 'end' },
  { title: 'Price', alignment: 'end' },
  { title: 'Allowance', alignment: 'end' },
];



  const rowMarkup = computedVariants.map((variant, index) => (
    <IndexTable.Row 
      id={variant.variantGID} 
      key={variant.variantGID} 
      position={index}>
      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text as="span" fontWeight="medium">
            {variant.productName || 'Untitled Product'}
          </Text>
          {variant.variantName && (
            <Text as="span" tone="subdued" variant="bodySm">
              {variant.variantName}
            </Text>
          )}
          {variant.categoryName && (
            <Badge size="small">{variant.categoryName}</Badge>
          )}
        </BlockStack>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <Text as="span">
          {formatCurrencyUSD((variant.sellingPrice || 0) * 100)}
        </Text>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <Text as="span" fontWeight="medium">
          {formatCurrencyUSD(variant.newSellingPrice * 100)}
        </Text>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <InlineStack gap="100" align="start">
          <Text 
            as="span" 
            tone={variant.priceChange > 0 ? "critical" : variant.priceChange < 0 ? "success" : undefined}
          >
            {variant.priceChange > 0 ? "+" : ""}{formatCurrencyUSD(variant.priceChange * 100)}
          </Text>
          <Text as="span" tone="subdued" variant="bodySm">
            ({variant.priceChangePercent > 0 ? "+" : ""}{variant.priceChangePercent.toFixed(1)}%)
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <Text as="span">
          {variant.newSellingPrice > 0 
            ? formatPercent(((variant.newSellingPrice - variant.newCogs) / variant.newSellingPrice))
            : "—"
          }
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const hasChanges = computedVariants.some(v => Math.abs(v.priceChange) > 0.01);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Bulk Edit ${variants.length} Variants`}
      primaryAction={{
        content: "Save Changes",
        onAction: handleSave,
        disabled: !hasChanges,
      }}
      secondaryActions={[
        {
          content: "Publish to Shopify",
          onAction: handlePublish,
          disabled: !hasChanges,
        },
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Layout>
          {/* Left side - Controls */}
          <InlineGrid columns={['oneThird', 'twoThirds']}>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Bulk Pricing Operation
                  </Text>

                  <BlockStack gap="300">
                    <RadioButton
                      label="Percentage markup"
                      checked={operation === 'percentage'}
                      id="percentage"
                      name="operation"
                      onChange={() => setOperation('percentage')}
                    />
                    {operation === 'percentage' && (
                      <Box paddingInlineStart="600">
                        <TextField
                          label="Markup percentage"
                          type="number"
                          value={percentageMarkup}
                          onChange={setPercentageMarkup}
                          suffix="%"
                          min={0}
                          step={0.1}
                          helpText="Apply percentage increase to current selling price"
                          autoComplete="off"
                        />
                      </Box>
                    )}

                    <RadioButton
                      label="Fixed amount adjustment"
                      checked={operation === 'fixed'}
                      id="fixed"
                      name="operation"
                      onChange={() => setOperation('fixed')}
                    />
                    {operation === 'fixed' && (
                      <Box paddingInlineStart="600">
                        <TextField
                          label="Amount to add"
                          type="number"
                          value={fixedAmount}
                          onChange={setFixedAmount}
                          prefix="$"
                          min={0}
                          step={.01}
                          helpText="Add fixed amount to profit markup"
                          autoComplete="off"
                        />
                      </Box>
                    )}

                    <RadioButton
                      label="Component-based formula"
                      checked={operation === 'formula'}
                      id="formula"
                      name="operation"
                      onChange={() => setOperation('formula')}
                    />
                    {operation === 'formula' && (
                      <Box paddingInlineStart="600">
                        <BlockStack gap="300">
                          <Text as="p" variant="bodySm" tone="subdued">
                            Set each component as percentage of COGS:
                          </Text>
                          
                          <TextField
                            label="Profit markup"
                            type="number"
                            value={profitMarkupPercent}
                            onChange={setProfitMarkupPercent}
                            suffix="% of COGS"
                            min={0}
                            step={0.1}
                            autoComplete="off"
                          />
                          
                          <TextField
                            label="Discount allowance"
                            type="number"
                            value={allowanceDiscountsPercent}
                            onChange={setAllowanceDiscountsPercent}
                            suffix="% of COGS"
                            min={0}
                            step={0.1}
                            autoComplete="off"
                          />
                          
                          <TextField
                            label="Shrink allowance"
                            type="number"
                            value={allowanceShrinkPercent}
                            onChange={setAllowanceShrinkPercent}
                            suffix="% of COGS"
                            min={0}
                            step={0.1}
                            autoComplete="off"
                          />
                          
                          <TextField
                            label="Financing allowance"
                            type="number"
                            value={allowanceFinancingPercent}
                            onChange={setAllowanceFinancingPercent}
                            suffix="% of COGS"
                            min={0}
                            step={0.1}
                            autoComplete="off"
                          />
                          
                          <TextField
                            label="Shipping allowance"
                            type="number"
                            value={allowanceShippingPercent}
                            onChange={setAllowanceShippingPercent}
                            suffix="% of COGS"
                            min={0}
                            step={0.1}
                            autoComplete="off"
                          />
                          
                          <TextField
                            label="Market adjustment"
                            type="number"
                            value={marketAdjustmentPercent}
                            onChange={setMarketAdjustmentPercent}
                            suffix="% of COGS"
                            step={0.1}
                            autoComplete="off"
                          />
                        </BlockStack>
                      </Box>
                    )}
                  </BlockStack>

                  <Divider />

                  <TextField
                    label="Notes (applied to all variants)"
                    value={notes}
                    onChange={setNotes}
                    multiline={3}
                    autoComplete="off"
                  />
                </BlockStack>
              </Box>
            </Card>
          

          {/* Right side - Preview */}
        
            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Price Preview
                  </Text>
                  
                  <IndexTable
                    itemCount={computedVariants.length}
                    headings={headings}
                    selectable={false}
                  >
                    {rowMarkup}
                  </IndexTable>

                  {hasChanges && (
                    <Box paddingBlockStart="400">
                      <InlineStack gap="200" align="center">
                        <Text as="span" tone="subdued">
                          {computedVariants.filter(v => Math.abs(v.priceChange) > 0.01).length} variants will be updated
                        </Text>
                      </InlineStack>
                    </Box>
                  )}
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>
        </Layout>
      </Modal.Section>
    </Modal>
  );
}


/*
// app/components/pricebuilder/BulkEditor.tsx chatgpt assist
import * as React from "react";
import { useState } from "react";
import { Card, BlockStack, InlineGrid, TextField, Button, Text } from "@shopify/polaris";

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
*/