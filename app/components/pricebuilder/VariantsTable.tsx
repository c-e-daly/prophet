// app/components/pricebuilder/VariantsTable.tsx
import { IndexTable, Card, useIndexResourceState, Text } from "@shopify/polaris";


export function VariantsTable({ rows, selected, onSelect, onSingleOpen }) {
const resourceName = { singular: 'variant', plural: 'variants' };
const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
rows.map(r => r.variantsGID)
);


// keep external state in sync
useEffect(() => { onSelect(selectedResources); }, [selectedResources]);


return (
<IndexTable
resourceName={resourceName}
itemCount={rows.length}
selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
onSelectionChange={handleSelectionChange}
headings=[
{ title: 'Product' },
{ title: 'Variant' },
{ title: 'SKU' },
{ title: 'Category' },
{ title: 'Collection' },
{ title: 'Current Price' },
{ title: 'Actions' },
]
>
{rows.map((r, idx) => (
<IndexTable.Row id={r.variantsGID} key={r.variantsGID} position={idx}>
<IndexTable.Cell><Text as="span">{r.productTitle}</Text></IndexTable.Cell>
<IndexTable.Cell>{r.variantTitle}</IndexTable.Cell>
<IndexTable.Cell>{r.variantSKU}</IndexTable.Cell>
<IndexTable.Cell>{r.category}</IndexTable.Cell>
<IndexTable.Cell>{r.collection}</IndexTable.Cell>
<IndexTable.Cell>{r.currentPrice?.toFixed(2)}</IndexTable.Cell>
<IndexTable.Cell>
<button className="Polaris-Button" onClick={() => onSingleOpen(r)}>Edit</button>
</IndexTable.Cell>
</IndexTable.Row>
))}
</IndexTable>
);
}