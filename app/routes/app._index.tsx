import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, Outlet, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Page, Layout, Text, Card, Button, BlockStack, Box, List, Link, InlineStack, Icon, Badge
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("📱 APP LOAD - URL:", request.url);
  console.log("📱 APP LOAD - Timestamp:", new Date().toISOString());
  
  // Just authenticate - shop data already stored during OAuth
  const { session } = await authenticate.admin(request);
  
  console.log("📱 App authenticated - ready to use");
  
  // TODO: Add queries to check setup status
  // For now, return mock data - replace with real database queries
  const setupStatus = {
    templates: false, // Check if Templates table has records for this shop
    campaigns: false, // Check if Campaigns table has records for this shop  
    programs: false,  // Check if Programs table has records for this shop
    priceBuilder: false // Check if PriceBuilder table has records for this shop
  };
  
  const quickStats = {
    winLossRate: "65%", // TODO: Calculate from offers data
    topOffer: "$125 Gaming Chair", // TODO: Get from database
    offerAOV: "$87.50", // TODO: Calculate average order value
    offerItems: 1247, // TODO: Count from database
    offerUnits: 892, // TODO: Sum from database
    averagePrice: "$67.23", // TODO: Calculate from database
    newCustomers: 156, // TODO: Count from database
    existingCustomers: 89 // TODO: Count from database
  };

  return json({ 
    shop: session.shop,
    setupStatus,
    quickStats
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  // Keep existing product creation action for now
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

function SetupCard({ setupStatus }: { setupStatus: any }) {
  const setupItems = [
    { key: 'templates', label: 'Templates', completed: setupStatus.templates },
    { key: 'campaigns', label: 'Campaigns', completed: setupStatus.campaigns },
    { key: 'programs', label: 'Programs', completed: setupStatus.programs },
    { key: 'priceBuilder', label: 'PriceBuilder', completed: setupStatus.priceBuilder },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Setup</Text>
        <BlockStack gap="300">
          {setupItems.map((item) => (
            <InlineStack key={item.key} align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                {item.completed ? (
                  <Icon source={CheckIcon} tone="success" />
                ) : (
                  <Box
                    background="bg-surface"
                    borderWidth="025"
                    borderColor="border"
                    borderRadius="050"
                    minWidth="20px"
                    minHeight="20px"
                  />
                )}
                <Text as="span">{item.label}</Text>
              </InlineStack>
              {item.completed ? (
                <Badge tone="success">Complete</Badge>
              ) : (
                <Badge>Pending</Badge>
              )}
            </InlineStack>
          ))}
        </BlockStack>
        <Button variant="primary" size="medium">
          Continue Setup
        </Button>
      </BlockStack>
    </Card>
  );
}

function BestPracticesCard() {
  const practices = [
    'Discounts as Opportunity Cost',
    'How to Price for Profits', 
    'Profiting During Clearance',
    'Recovering Lost Deals'
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Best Practices</Text>
        <List>
          {practices.map((practice, index) => (
            <List.Item key={index}>
              <Link removeUnderline>{practice}</Link>
            </List.Item>
          ))}
        </List>
        <Button variant="primary" size="medium">
          View Learning Center
        </Button>
      </BlockStack>
    </Card>
  );
}

function QuickStatsCard({ quickStats }: { quickStats: any }) {
  const stats = [
    { label: 'Offers Win/Loss Rate', value: quickStats.winLossRate },
    { label: 'Top Offer', value: quickStats.topOffer },
    { label: 'Offer AOV', value: quickStats.offerAOV },
    { label: 'Offer Items', value: quickStats.offerItems.toLocaleString() },
    { label: 'Offer Units', value: quickStats.offerUnits.toLocaleString() },
    { label: 'Average Price', value: quickStats.averagePrice },
    { label: 'New Customers', value: quickStats.newCustomers },
    { label: 'Existing Customers', value: quickStats.existingCustomers },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Quick Stats</Text>
        <BlockStack gap="200">
          {stats.map((stat, index) => (
            <InlineStack key={index} align="space-between">
              <Text as="span" variant="bodyMd" tone="subdued">
                {stat.label}
              </Text>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {stat.value}
              </Text>
            </InlineStack>
          ))}
        </BlockStack>
        <Button variant="primary" size="medium">
          View Full Analytics
        </Button>
      </BlockStack>
    </Card>
  );
}

export default function Index() {
  const { setupStatus, quickStats } = useLoaderData<typeof loader>();
  
  return (
    <Page>
      <TitleBar title="Customer Generated Offers Dashboard" />
      <BlockStack gap="500">
        {/* Welcome Message */}
        <Card>
          <BlockStack gap="300">
            <Text as="h1" variant="headingLg">
              Welcome to Customer Generated Offers from I Want That!
            </Text>
            <Text variant="bodyLg" as="p">
              We are excited to have you and look forward to helping you build a profitable shop with customer generated offers. Let's get you set up.
            </Text>
          </BlockStack>
        </Card>

        {/* Three Cards Row */}
        <Layout>
          <Layout.Section variant="oneThird">
            <SetupCard setupStatus={setupStatus} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BestPracticesCard />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <QuickStatsCard quickStats={quickStats} />
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Outlet />
    </Page>
  );
}