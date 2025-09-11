// app/components/pricebuilder/VariantsTable.tsx
import { useState, useCallback } from "react";
import { Box, Button, Card, IndexTable, Text, Badge, InlineStack, Thumbnail,
  Tooltip, EmptyState} from "@shopify/polaris";
import { EditIcon, ExternalIcon } from "@shopify/polaris-icons";
import type { VPView } from "../../routes/app.pricebuilder._index";
import { formatCurrencyUSD, formatDate } from "../../utils/format";

interface VariantsTableProps {
  rows: VPView[];
  selected: string[];
  onSelect: (selected: string[]) => void;
  onSingleEdit: (row: VPView) => void;
  loading?: boolean;
}

export function VariantsTable({
  rows,
  selected,
  onSelect,
  onSingleEdit,
  loading = false
}: VariantsTableProps) {
  const [sortedBy, setSortedBy] = useState<string>("modifiedDate");
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending">("descending");

  // Handle selection
  const handleSelectionChange = useCallback(
    (selectionType: "all" | "none" | "page", toggleType?: boolean, selection?: string) => {
      if (selectionType === "all") {
        onSelect(rows.map(row => row.variantsGID));
      } else if (selectionType === "none") {
        onSelect([]);
      } else if (selection) {
        const isSelected = selected.includes(selection);
        if (isSelected) {
          onSelect(selected.filter(id => id !== selection));
        } else {
          onSelect([...selected, selection]);
        }
      }
    },
    [rows, selected, onSelect]
  );

  // Handle sorting
  const handleSort = useCallback((headingIndex: number, direction: "ascending" | "descending") => {
    const sortKeys = [
      "productTitle",
      "variantTitle", 
      "categoryName",
      "sellingPrice",
      "profitMargin",
      "modifiedDate"
    ];
    
    setSortedBy(sortKeys[headingIndex]);
    setSortDirection(direction);
  }, []);

  // Sort rows
  const sortedRows = [...rows].sort((a, b) => {
    let aVal: any = a[sortedBy as keyof VPView];
    let bVal: any = b[sortedBy as keyof VPView];
    
    // Handle null/undefined values
    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";
    
    // Handle numbers
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "ascending" ? aVal - bVal : bVal - aVal;
    }
    
    // Handle strings/dates
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === "ascending") {
      return aStr.localeCompare(bStr);
    }
    return bStr.localeCompare(aStr);
  });

  // Calculate profit margin for display
  const calculateProfitMargin = (row: VPView): number => {
    const cogs = row.cogs || 0;
    const sellingPrice = row.sellingPrice || 0;
    if (sellingPrice <= 0) return 0;
    return ((sellingPrice - cogs) / sellingPrice) * 100;
  };

  // Get price comparison badge
  const getPriceComparisonBadge = (row: VPView) => {
    const shopifyPrice = row.currentShopifyPrice || 0;
    const newPrice = row.sellingPrice || 0;
    
    if (shopifyPrice === 0 || newPrice === 0) return null;
    
    const difference = ((newPrice - shopifyPrice) / shopifyPrice) * 100;
    
    if (Math.abs(difference) < 1) {
      return <Badge tone="info">Same</Badge>;
    } else if (difference > 0) {
      return (
        <Badge tone="attention">
          +{difference.toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge tone