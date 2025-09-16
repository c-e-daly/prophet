import * as React from "react";
import { Box, BlockStack, Text } from "@shopify/polaris";
import type { KpiMini } from "../../lib/types/portfolios";

type Props = KpiMini & { align?: "start" | "center" | "end" };

export default function KpiMiniBox({ title, value, sub, align = "start" }: Props) {
  return (
    <Box padding="300" borderRadius="300" background={"bg-fill-secondary"}>
      <BlockStack gap="050" align={align}>
        <Text as="span" tone="subdued" variant="bodySm">{title}</Text>
        <Text as="h4" variant="headingLg">{value}</Text>
        {sub ? <Text as="span" tone="subdued" variant="bodySm">{sub}</Text> : null}
      </BlockStack>
    </Box>
  );
}
