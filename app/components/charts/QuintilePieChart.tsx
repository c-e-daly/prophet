import * as React from "react";
import { Box, Text } from "@shopify/polaris";
import { ClientOnly } from "@remix-run/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LabelList } from "recharts";
import type { QuintilePoint } from "../../lib/types/portfolios";

const COLORS = ["#4F46E5", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444"]; // Q1..Q5
const fmtUSD0 = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

type Props = {
  data: QuintilePoint[];                // 5 items, growth in $
  height?: number;                      // chart height
  title?: string;                       // small caption above
};

export default function QuintileGrowthPie({ data, height = 180, title }: Props) {
  const total = data.reduce((s, d) => s + d.growth, 0);

  const pieData = data.map((d) => ({
    name: d.q,
    growth: d.growth,
    value: d.growth <= 0 ? 0.0001 : d.growth, // keep a visible slice even if negative
    pctOfNet: total !== 0 ? (d.growth / total) * 100 : 0,
  }));

  return (
    <Box>
      {title ? (
        <Text as="span" variant="bodySm" tone="subdued">{title}</Text>
      ) : null}
      <Box minHeight={`${height}px`}>
        <ClientOnly fallback={<Box paddingBlockStart="200"><Text as="p" tone="subdued">Loading…</Text></Box>}>
          {() => (
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} strokeWidth={1}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  <LabelList dataKey="name" position="outside" />
                </Pie>
                <Tooltip
                  formatter={(_val: number, _n: string, p: any) => {
                    const g = p.payload.growth as number;
                    const pct = p.payload.pctOfNet as number;
                    return [`${fmtUSD0(g)} (${pct.toFixed(1)}% of net)`, p.payload.name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ClientOnly>
      </Box>
    </Box>
  );
}
