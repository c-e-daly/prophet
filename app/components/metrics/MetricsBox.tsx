import * as React from "react";
import { Box, BlockStack, Text } from "@shopify/polaris";
import type { MetricBoxT } from "../../lib/types/portfolios";

type MetricBoxProps = Omit<MetricBoxT, "key">;

export default function MetricBox({ title, valueCY, valuePY, yoyPct, trend }: MetricBoxT) {
  const tone = trend === "up" ? "success" : trend === "down" ? "critical" : "subdued";
  const sign = yoyPct > 0 ? "+" : "";
  
  return (
    <Box  padding="300" borderRadius="300" background={"bg-fill-info"}>
      <BlockStack gap="100">
        <Text as="h4" variant="headingSm">{title}</Text>
        <Text as="p" variant="bodySm">CY: {valueCY}</Text>
        <Text as="p" variant="bodySm">PY: {valuePY}</Text>
        <Text as="span" variant="bodySm" tone={tone}>{`${sign}${yoyPct.toFixed(1)}% YOY`}</Text>
      </BlockStack>
    </Box>
  );
}
