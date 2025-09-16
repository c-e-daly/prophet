import * as React from "react";
import { Card, Box, BlockStack, InlineGrid, Text, Link as PolarisLink } from "@shopify/polaris";
import QuintileGrowthPie from "../charts/QuintilePieChart";
import MetricBox from "../metrics/MetricsBox";
import type { PortfolioSnapshot } from "../../lib/types/portfolios";

type Props = { snapshot: PortfolioSnapshot };

export default function PortfolioCard({ snapshot }: Props) {
  const route = `/app/portfolios/${snapshot.slug}`;
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">{snapshot.name} Portfolio</Text>
          <InlineGrid columns={["oneThird", "twoThirds"]} gap="400">
            <QuintileGrowthPie
              data={snapshot.quintileGrowth}
              title="Share of Net Growth by Quintile (YTD)"
            />
            <BlockStack gap="300">
              {snapshot.metrics.map((m) => (
                <MetricBox key={m.key} {...m} />
              ))}
            </BlockStack>
          </InlineGrid>
          <PolarisLink url={route}>{`Explore ${snapshot.name} Portfolio →`}</PolarisLink>
        </BlockStack>
      </Box>
    </Card>
  );
}
