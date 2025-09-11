// app/components/pricebuilder/BulkEditor.tsx
import { Card, BlockStack, TextField, InlineStack, Button, Text, Tooltip } from "@shopify/polaris";
import { useState, useMemo } from "react";
import { computeEffectivePrice } from "./pricingMath";


const tips = {
profitMarkupPct: 'Percent of COGS to add as profit (e.g., 40 = 40%).',
allowanceDiscountsPct: 'Percent of COGS reserved for discounting.',
allowanceShrinkPct: 'Percent of COGS reserved for shrink risk.',
allowanceFinancingPct: 'Percent of price reserved for fees.',
allowanceShippingPct: 'Percent of COGS for shipping (use 0 if N/A).',
};


export function BulkEditor({ selected, onApply }) {
const [p, setP] = useState({
profitMarkupPct: '', allowanceDiscountsPct: '', allowanceShrinkPct: '', allowanceFinancingPct: '', allowanceShippingPct: ''
});


const preview = useMemo(() => selected.slice(0, 3).map(row => ({
row,
price: computeEffectivePrice({
mode: 'bulk', row,
profitMarkupPct: Number(p.profitMarkupPct || 0),
allowanceDiscountsPct: Number(p.allowanceDiscountsPct || 0),
allowanceShrinkPct: Number(p.allowanceShrinkPct || 0),
allowanceFinancingPct: Number(p.allowanceFinancingPct || 0),
allowanceShippingPct: Number(p.allowanceShippingPct || 0),
})
})), [p, selected]);


const applyAll = () => {
const payload = selected.map(row => ({
variantsGID: row.variantsGID,
productsGID: row.productsGID,
...p,
// The compute happens server-side OR we can precompute here for speed:
effectivePrice: Number(
computeEffectivePrice({
mode: 'bulk', row,
profitMarkupPct: Number(p.profitMarkupPct || 0),
allowanceDiscountsPct: Number(p.allowanceDiscountsPct || 0),
allowanceShrinkPct: Number(p.allowanceShrinkPct || 0),
allowanceFinancingPct: Number(p.allowanceFinancingPct || 0),
allowanceShippingPct: Number(p.allowanceShippingPct || 0)
}).toFixed(2)
),
source: 'bulk'
}));
onApply(payload);
};


return (
<Card title={`Bulk edit: ${selected.length} variants`}>
<BlockStack gap="300">
{Object.entries(p).map(([k, v]) => (
<Tooltip key={k} content={tips[k] as string}>
<TextField type="number" label={`${k.replace('Pct','')} (%)`} value={v} onChange={(x) => setP(prev => ({ ...prev, [k]: x }))} autoComplete="off" suffix="%" />
</Tooltip>
))}
<Text as="p">Preview first 3:</Text>
{preview.map((x, i) => <Text key={i} as="p">{x.row.productTitle} / {x.row.variantTitle}: {x.price.toFixed(2)}</Text>)}


<InlineStack gap="200">
<Button onClick={applyAll} variant="primary">Apply to Selected</Button>
</InlineStack>
</BlockStack>
</Card>
);
}