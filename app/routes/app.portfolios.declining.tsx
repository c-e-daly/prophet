import React from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import { Page, Layout, Card, Text, InlineStack, BlockStack, Button, Box } from "@shopify/polaris";
import { getDashboardSummary } from "../lib/queries/appManagement/getShopDashboard";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BreadcrumbsBar } from "../components/BreadcrumbsBar";


export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) throw new Error("Missing shop");

  const summary = await getDashboardSummary(shop);
  return { summary, shop };
}

type MonthPoint = { date: string; cy: number; py: number };
type WeekPoint = { date: string; cy: number };

function NorTrend({
  months,
  weeks,
}: {
  months: MonthPoint[];
  weeks: WeekPoint[];
}) {
  const [mode, setMode] = React.useState<"weeks" | "months">("weeks");
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const fmtUSD = (n: number) =>
    (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // ---- Build series ----
  const weekSeries = [
    {
      type: "line" as const,
      name: "NOR (CY)",
      data: (weeks ?? []).map((p) => [Date.parse(p.date + "T00:00:00Z"), Number(p.cy) || 0]) as [number, number][],
      tooltip: { valueDecimals: 0 },
    },
  ];

  const monthCategories = (months ?? []).map((m) =>
    new Date(m.date).toLocaleDateString(undefined, { month: "short" })
  );
  const monthSeriesCY = (months ?? []).map((m) => Number(m.cy) || 0);
  const monthSeriesPY = (months ?? []).map((m) => Number(m.py) || 0);

  const commonYAxis = {
    labels: {
      formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
        return fmtUSD(Number(this.value as number));
      },
    },
    title: { text: "" },
  };

  const stockOptionsWeeks: Highcharts.Options = {
    chart: { height: 320 },
    rangeSelector: {
      selected: 1,
      buttons: [
        { type: "week", count: 4, text: "4W" },
        { type: "week", count: 8, text: "8W" },
        { type: "week", count: 13, text: "13W" },
        { type: "all", text: "All" },
      ],
    },
    navigator: { enabled: true },
    scrollbar: { enabled: false },
    yAxis: commonYAxis as any,
    xAxis: { type: "datetime" },
    tooltip: {
      shared: true,
      formatter: function (this: any) {
        const label = Highcharts.dateFormat("%b %e, %Y", this.x as number);
        const lines = (this.points ?? []).map((p: any) => `${p.series.name}: ${fmtUSD(p.y)}`);
        return `<b>${label}</b><br/>${lines.join("<br/>")}`;
      },
    },
    series: weekSeries as any,
    credits: { enabled: false },
    legend: { enabled: true },
    title: { text: undefined },
  };

  const optionsMonths: Highcharts.Options = {
    chart: { height: 320, type: "line" },
    xAxis: { categories: monthCategories },
    yAxis: commonYAxis as any,
    tooltip: {
      shared: true,
      formatter: function (this: any) {
        const label = String(this.key ?? "");
        const lines = (this.points ?? []).map((p: any) => `${p.series.name}: ${fmtUSD(p.y)}`);
        return `<b>${label}</b><br/>${lines.join("<br/>")}`;
      },
    },
    series: [
      { type: "line", name: "CYTD NOR", data: monthSeriesCY },
      { type: "line", name: "PYTD NOR", data: monthSeriesPY },
    ],
    credits: { enabled: false },
    legend: { enabled: true },
    title: { text: undefined },
  };

  return (
    <Page
      title="Declining Portfolio">
      <BreadcrumbsBar items={[
        { to: "..", label: "Portfolios", relative: "route" },
        { to: ".", label: "Declining" },
      ]} />
      <Card>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h3" variant="headingMd">NOR Sales — Interactive</Text>
            <Box>
              <Button pressed={mode === "weeks"} onClick={() => setMode("weeks")}>Weeks</Button>
              <Button pressed={mode === "months"} onClick={() => setMode("months")}>Months (CY vs PY)</Button>
            </Box>
          </InlineStack>

          <Box>
            {mounted && (
              mode === "weeks" ? (
                <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={stockOptionsWeeks} />
              ) : (
                <HighchartsReact highcharts={Highcharts} options={optionsMonths} />
              )
            )}
          </Box>
        </BlockStack>
      </Card>
    </Page>
  );
}

export default function DecliningPortfolio() {
  const { summary } = useLoaderData<{
    summary: { nor_by_month?: MonthPoint[]; nor_by_week_13?: WeekPoint[] };
  }>();

  return (
    <Page title="Declining Portfolio">
      <Layout>
        <Layout.Section>
          <NorTrend
            months={summary?.nor_by_month ?? []}
            weeks={summary?.nor_by_week_13 ?? []}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
