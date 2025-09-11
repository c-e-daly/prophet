// app/components/pricebuilder/FiltersBar.tsx
import { useSearchParams, useSubmit } from "@remix-run/react";
import { InlineStack, TextField, Button, Select, InlineGrid } from "@shopify/polaris";
import { useEffect, useState } from "react";

export function FiltersBar() {
const [sp] = useSearchParams();
const submit = useSubmit();
const [q, setQ] = useState(sp.get("q") || "");


const onApply = () => {
const params = new URLSearchParams(sp);
if (q) params.set("q", q); else params.delete("q");
submit(params);
};


return (
<InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="300">
<TextField label="Search products" value={q} onChange={setQ} autoComplete="off" />
{/* TODO: wire category, collection, date pickers */}
<InlineStack gap="200" align="end">
<Button onClick={onApply} variant="primary">Apply Filters</Button>
</InlineStack>
</InlineGrid>
);
}