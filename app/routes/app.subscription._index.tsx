//app/routes/app.templates.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {Page, Layout,Card,Text,Button,BlockStack,InlineStack,Box,Badge,Divider} from "@shopify/polaris";
import { ShopSessionProvider } from "../context/shopSession";
import { requireShopSession } from "../lib/session/shopAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireShopSession(request);
  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      shopSession,
    } as const,
    { headers }
  );
}

export default function SubscriptionIndex() {
  const { shopSession } = useLoaderData<typeof loader>();
  return (
<ShopSessionProvider value={shopSession}>
  <Page title="Subscription Management"> 
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
           
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Subscription Status
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="start">
                      <Text as="span" variant="bodyMd">
                        Status:
                      </Text>
                      <Badge tone="success">Active</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodyMd">
                      Your subscription is currently active and all features are available.
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Next billing date: January 15, 2024
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>

        
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Billing Information
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="300">
                    <Text as="p" variant="bodyMd">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        Payment Method:
                      </Text>{" "}
                      •••• •••• •••• 1234 (Visa)
                    </Text>
                    <Text as="p" variant="bodyMd">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        Billing Address:
                      </Text>{" "}
                      123 Main St, Anytown, AN 12345
                    </Text>
                    <Text as="p" variant="bodyMd">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        Billing Cycle:
                      </Text>{" "}
                      Monthly
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>

        
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Current Plan
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="start">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        Professional Plan
                      </Text>
                      <Badge>$29/month</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodyMd">
                      Includes advanced features, priority support, and unlimited usage.
                    </Text>
                    <Divider />
                    <Text as="h3" variant="headingSm">
                      Plan Features:
                    </Text>
                    <Box paddingInlineStart="400">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          • Unlimited products and orders
                        </Text>
                        <Text as="p" variant="bodyMd">
                          • Advanced analytics and reporting
                        </Text>
                        <Text as="p" variant="bodyMd">
                          • Priority customer support
                        </Text>
                        <Text as="p" variant="bodyMd">
                          • Custom integrations
                        </Text>
                      </BlockStack>
                    </Box>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>

        
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Manage Subscription
                </Text>
                <Box paddingBlockStart="200">
                  <InlineStack gap="300">
                    <Button variant="primary">
                      Manage Billing
                    </Button>
                    <Button>
                      Change Plan
                    </Button>
                  </InlineStack>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
 </Page> 
</ShopSessionProvider>
  );
}
