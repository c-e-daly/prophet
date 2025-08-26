// app/routes/app.campaigns._index.tsx
import * as React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Card, BlockStack, InlineStack, Text, Button, IndexTable, Badge } from "@shopify/polaris";
import type { Tables, Enum} from "../lib/queries/types/dbTables"
import { fetchCampaignsWithPrograms } from "../lib/queries/getShopCampaigns";
import { getShopFromSession, getShopIdFromSupabase } from "../lib/hooks/useShopContext.server";
import { formatCurrencyUSD, formatDate, truncate } from "../utils/format";

type Campaign = Tables<"campaigns">;
type Program  = Tables<"programs">;

type LoaderData = {
  campaigns: Array<Campaign & { programs: Program[] }>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get shop data from session
  const { shop } = await getShopFromSession(request); //get shop domain from session
  const shopsId = await getShopIdFromSupabase(shop);  // use session domain to get supabase shops.id
  const campaigns = await fetchCampaignsWithPrograms(shopsId); // pass shops.id to get campaigns & programs
  
  return json<LoaderData>({ campaigns });
};

export default function CampaignsIndex() {
  const { campaigns } = useLoaderData<typeof loader>();

  
  return (
    <Page
      title="Campaigns"
      primaryAction={
        <Button
          url="/app/campaigns/create"
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
                        <Link to={`/app/campaigns/${c.id}`}>
                          {c.campaignName}
                        </Link>
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
                    <Badge tone={c.status === "Active" ? "success" : "attention"}>
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
                              <Link to={`/app/campaigns/programs/${p.id}`}>
                                {p.programName}
                              </Link>
                            </Text>
                            <br />
                            <Text as="span" tone="subdued" variant="bodySm">
                              {p.programFocus ?? "—"} · {p.status}
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