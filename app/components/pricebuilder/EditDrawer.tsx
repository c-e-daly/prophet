import { Sheet, Box, Button, BlockStack, InlineStack, Text } from "@shopify/polaris";
import { useMemo, useState } from "react";
import { PriceForm, type PriceFormValues } from "./PriceForm";

type EditDrawerProps = {
  row: {
    variantsGID: string;
    productsGID: string;
    productTitle?: string | null;
    variantTitle?: string | null;
    currentPrice?: number | null;
  };
  open: boolean;
  onClose: () => void;
  onApply: (payload: {
    variantsGID: string;
    productsGID: string;
    cogs: number;
    profitMarkup: number;
    allowanceDiscounts: number;
    allowanceShrink: number;
    allowanceFinancing: number;
    allowanceShipping: number;
    marketAdjustment: number;
    effectivePrice: number;
    source: "manual";
    notes?: string;
  }) => void;
  seed?: Partial<PriceFormValues>;
};

export function EditDrawer({ row, open, onClose, onApply, seed }: EditDrawerProps) {
  const [form, setForm] = useState<PriceFormValues>({
    cogs: seed?.cogs ?? "",
    profitMarkup: seed?.profitMarkup ?? "",
    allowanceDiscounts: seed?.allowanceDiscounts ?? "",
    allowanceShrink: seed?.allowanceShrink ?? "",
    allowanceFinancing: seed?.allowanceFinancing ?? "",
    allowanceShipping: seed?.allowanceShipping ?? "",
    marketAdjustment: seed?.marketAdjustment ?? "",
    notes: seed?.notes ?? "",
  });

  const sellingPrice = useMemo(() => {
    const n = (v?: string) => (v ? Number(v) : 0);
    return Number((
      n(form.cogs) + n(form.profitMarkup) + n(form.allowanceDiscounts) +
      n(form.allowanceShrink) + n(form.allowanceFinancing) +
      n(form.allowanceShipping) + n(form.marketAdjustment)
    ).toFixed(2));
  }, [form]);

  const toNum = (v?: string) => (v ? Number(v) : 0);

  return (
    <Sheet open={open} onClose={onClose} accessibilityLabel="Edit price">
      <Box padding="400">
        <BlockStack gap="300">
          <Text variant="headingMd" as="h2">
            Edit – {row.productTitle} / {row.variantTitle}
          </Text>

          <PriceForm
            values={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            sellingPrice={sellingPrice}
            showPercents
          />

          <InlineStack gap="200" align="end">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() =>
                onApply({
                  variantsGID: row.variantsGID,
                  productsGID: row.productsGID,
                  cogs: toNum(form.cogs),
                  profitMarkup: toNum(form.profitMarkup),
                  allowanceDiscounts: toNum(form.allowanceDiscounts),
                  allowanceShrink: toNum(form.allowanceShrink),
                  allowanceFinancing: toNum(form.allowanceFinancing),
                  allowanceShipping: toNum(form.allowanceShipping),
                  marketAdjustment: toNum(form.marketAdjustment),
                  effectivePrice: sellingPrice,
                  source: "manual",
                  notes: form.notes,
                })
              }
            >
              Apply
            </Button>
          </InlineStack>
        </BlockStack>
      </Box>
    </Sheet>
  );
}
