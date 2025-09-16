import * as React from "react";
import { Box, Card, DataTable, Text, BlockStack, Tooltip } from "@shopify/polaris";
import type { QuintileSection, TableFormat } from "../../lib/types/portfolios";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const fmtPercent = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n)}%`;
const fmtDays = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n)}d`;

function formatCell(fmt: TableFormat, v: number | string | null): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  switch (fmt) {
    case "currency": return fmtCurrency(v);
    case "percent": return fmtPercent(v);
    case "days":    return fmtDays(v);
    case "number":  return fmtNumber(v);
    default:        return String(v);
  }
}

type Props = {
  sections: QuintileSection[];
  heading?: string;
};

export default function QuintileMatrix({ sections, heading }: Props) {
  return (
    <BlockStack gap="400">
      {heading ? <Text as="h3" variant="headingMd">{heading}</Text> : null}

      {sections.map((sec) => {
        const headings = ["Metric", "Q1", "Q2", "Q3", "Q4", "Q5"];

        const rows = sec.rows.map((r) => {
          const labelCell: React.ReactNode = r.desc ? (
            <Tooltip content={r.desc}>
              <Text as="span" variant="bodySm" tone="subdued">{r.label}</Text>
            </Tooltip>
          ) : (
            <Text as="span" variant="bodySm">{r.label}</Text>
          );
          return [
            labelCell,
            ...r.values.map((v) => formatCell(r.fmt, v)),
          ];
        });

        return (
          <Card key={sec.id}>
            <Box padding="400">
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">{sec.heading}</Text>
                <DataTable
                  hasZebraStripingOnData
                  columnContentTypes={["text","text","text","text","text","text"]}
                  headings={headings}
                  rows={rows}
                  increasedTableDensity
                />
              </BlockStack>
            </Box>
          </Card>
        );
      })}
    </BlockStack>
  );
}
