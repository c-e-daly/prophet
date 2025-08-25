// app/routes/app.campaigns.tsx
import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Outlet } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Box, Badge } from "@shopify/polaris";
import type { Campaign, Program } from "../lib/queries/enumTypes";
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { withShopLoader } from "../lib/queries/withShopLoader";
import { formatCurrencyUSD, formatDate, truncate } from "../utils/format";

type LoaderData = {
  shopDomain: string;
  shopId: number;
  campaigns: Array<Campaign & { programs: Program[] }>;
};

export const loader = withShopLoader(async ({ shopId, shopDomain, request }: {
  shopId: number; shopDomain: string; request: LoaderFunctionArgs["request"];
}) => {
  const campaigns = await fetchCampaignsWithPrograms(shopId);
  return json<LoaderData>({ shopDomain, shopId, campaigns });
});

export default function CampaignsIndex() {
  const { shopDomain, campaigns } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Campaigns"
      primaryAction={
        <Button
          url={`/app/campaigns/create?shop=${encodeURIComponent(shopDomain)}`}
          variant="primary"
        >
          Create Campaign
        </Button>
      }
    >
      <BlockStack gap="500">
        <Card>
          <IndexTable
            resourceName={{ singular: "campaign", plural: "campaigns" }}
            itemCount={campaigns.length}
            headings={[
              { title: "Name" },
              { title: "Status" },
              { title: "Dates" },
              { title: "Programs" },
              { title: "Budget" },
            ]}
            selectable={false}
          >
            {campaigns.map(
              (c: Campaign & { programs: Program[] }, index: number) => (
                <IndexTable.Row id={String(c.id)} key={c.id} position={index}>
                  <IndexTable.Cell>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {c.campaignName}
                      </Text>
                      {c.description ? (
                        <Text as="p" tone="subdued">
                          {truncate(c.description, 120)}
                        </Text>
                      ) : null}
                      {c.codePrefix ? (
                        <Text as="span" tone="subdued">
                          Code Prefix: {c.codePrefix}
                        </Text>
                      ) : null}
                    </BlockStack>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Badge tone={c.status === "ACTIVE" ? "success" : "attention"}>
                      {c.status}
                    </Badge>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span">
                      {formatDate(c.startDate)} — {formatDate(c.endDate)}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <InlineStack gap="200" wrap>
                      {c.programs.length > 0 ? (
                        c.programs.map((p: Program) => (
                          <div
                            key={p.id}
                            style={{
                              border: "1px solid var(--p-color-border, #E3E3E3)",
                              padding: "var(--p-space-050, 4px) var(--p-space-200, 8px)",
                              borderRadius: 6,
                            }}
                          >
                            <Text as="span" variant="bodySm">
                              {p.programName}
                            </Text>
                            <br />
                            <Text as="span" tone="subdued" variant="bodySm">
                              {p.type ?? "—"} · {p.status}
                            </Text>
                          </div>
                        ))
                      ) : (
                        <Text as="span" tone="subdued">
                          No programs
                        </Text>
                      )}
                    </InlineStack>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text as="span">
                      {c.budget != null ? formatCurrencyUSD(c.budget) : "—"}
                    </Text>
                  </IndexTable.Cell>
                </IndexTable.Row>
              )
            )}
          </IndexTable>
        </Card>
      </BlockStack>
    </Page>
  );
}
