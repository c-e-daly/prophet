// app/components/pricebuilder/EditDrawer.tsx
import { Sheet, Box, TextField, InlineStack, Button, BlockStack, Tooltip, Text } from "@shopify/polaris";
import { useState, useMemo } from "react";
import { computeEffectivePrice, roundToCharm } from "./pricingMath";


const tips = {
cogs: 'Your landed cost of goods for this variant.',
profitMarkup: 'Absolute dollars you need above COGS to hit contribution goal.',
allowanceDiscounts: 'Dollars you’re willing to give away in offers/discounts.',
allowanceShrink: 'Dollars reserved for shrink/damage/returns risk.',
allowanceFinancing: 'Dollars to cover BNPL/processing fees.',
allowanceShipping: 'Per-unit shipping dollars for this item.',
marketAdjustment: 'Delta added to reach a charm price (e.g., +2.99 to hit 29.99).',
};


export function EditDrawer({ row, onClose, onApply }) {
const [form, setForm] = useState({
cogs: '', profitMarkup: '', allowanceDiscounts: '', allowanceShrink: '', allowanceFinancing: '', allowanceShipping: '', marketAdjustment: ''
});


const effectivePrice = useMemo(() => computeEffectivePrice({
mode: 'single',
row,
...Object.fromEntries(Object.entries(form).map(([k,v]) => [k, Number(v || 0)]))
}), [form, row]);


return (
<Sheet open onClose={onClose} accessibilityLabel="Edit price">
<Box padding="400">
<BlockStack gap="300">
<Text variant="headingMd" as="h2">Edit – {row.productTitle} / {row.variantTitle}</Text>
{Object.entries(form).map(([key, val]) => (
<Tooltip key={key} content={tips[key] as string} preferredPosition="above">
<TextField type="number" label={key} value={val} onChange={(v) => setForm(f => ({ ...f, [key]: v }))} autoComplete="off" suffix="USD" />
</Tooltip>
))}


<Text as="p">Preview New Price: <b>{effectivePrice.toFixed(2)}</b></Text>


<InlineStack gap="200">
<Button onClick={onClose}>Cancel</Button>
<Button variant="primary" onClick={() => onApply({
variantsGID: row.variantsGID,
productsGID: row.productsGID,
...Object.fromEntries(Object.entries(form).map(([k,v]) => [k, Number(v || 0)])),
effectivePrice: Number(effectivePrice.toFixed(2)),
source: 'manual'
})}>Apply</Button>
</InlineStack>
</BlockStack>
</Box>
</Sheet>
);
}