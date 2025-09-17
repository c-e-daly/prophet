import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher , Outlet} from "@remix-run/react";
import { Page, Layout, Text, Card, Button, BlockStack, Box, List, Link, InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server"; // Add this import

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("📱📱📱 APP INDEX HIT - URL:", request.url);
  console.log("📱📱📱 APP INDEX HIT - Timestamp:", new Date().toISOString());
  
  const { admin, session } = await authenticate.admin(request);
  
  console.log("📱 App index auth successful:", { 
    shop: session?.shop, 
    hasToken: !!session?.accessToken,
    scope: session?.scope 
  });
  
  // Store shop data on first load after authentication
  if (session?.shop && session?.accessToken) {
    try {
      console.log("📱 About to store shop data from app index...");
      await storeShopData(session, admin);
      console.log("📱 Shop data stored from app index successfully");
    } catch (error) {
      console.error("📱 Error storing shop data:", error);
      // Don't fail the app load if shop data storage fails
    }
  }

  return null;
};

// Add the storeShopData function
async function storeShopData(session: any, admin: any) {
  console.log("💾💾💾 STORE SHOP DATA CALLED FROM APP INDEX - Timestamp:", new Date().toISOString());
  console.log("💾💾💾 Session data:", { shop: session?.shop, hasToken: !!session?.accessToken });
  
  const supabase = createClient();
  
  try {
    console.log("Fetching shop data from Shopify for:", session.shop);
    
    // Fetch shop data from Shopify using GraphQL instead of REST
    console.log("Making GraphQL request for shop data...");
    const shopResponse = await admin.graphql(
      `#graphql
        query getShop {
          shop {
            id
            name
            myshopifyDomain
            primaryDomain {
              host
            }
            currencyCode
            phone
            billingAddress {
              address1
              address2
              city
              province
              country
              zip
            }
          }
        }`
    );
    
    const responseJson = await shopResponse.json();
    console.log("GraphQL Shop response:", responseJson);
    
    if (responseJson.errors) {
      console.error("GraphQL errors:", responseJson.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(responseJson.errors)}`);
    }
    
    const shopInfo = responseJson.data?.shop;
    if (!shopInfo) {
      console.error("No shop info in response:", shopResponse);
      throw new Error("Could not fetch shop info from Shopify");
    }
    
    console.log("Shop info retrieved:", {
      id: shopInfo.id,
      name: shopInfo.name,
      myshopifyDomain: shopInfo.myshopifyDomain,
      primaryDomain: shopInfo.primaryDomain?.host
    });
    
    const now = new Date().toISOString();
    
    // Prepare shop data for upsert - using GraphQL response structure
    const shopData = {
      shopsGID: shopInfo.id.replace('gid://shopify/Shop/', ''), // Remove GID prefix
      shopDomain: session.shop,
      brandName: shopInfo.name || session.shop,
      companyLegalName: shopInfo.name || session.shop,
      storeCurrency: shopInfo.currencyCode || 'USD',
      commercePlatform: "shopify",
      companyPhone: shopInfo.phone || null,
      companyAddress: shopInfo.billingAddress ? {
        address1: shopInfo.billingAddress.address1,
        address2: shopInfo.billingAddress.address2 || null,
        city: shopInfo.billingAddress.city,
        province: shopInfo.billingAddress.province,
        country: shopInfo.billingAddress.country,
        zip: shopInfo.billingAddress.zip,
      } : null,
      isActive: true,
      createDate: now,
      modifiedDate: now,
    };
    
    console.log("Upserting shop data:", shopData);
    
    // Upsert shop data
    const { data: shopsRow, error: shopError } = await supabase
      .from("shops")
      .upsert(shopData, { onConflict: "shopDomain" })
      .select()
      .single();
    
    if (shopError) {
      console.error("Shop upsert error:", shopError);
      throw new Error(`Shop upsert failed: ${shopError.message}`);
    }
    
    if (!shopsRow) {
      console.error("No shop row returned from upsert");
      throw new Error("Shop upsert returned no data");
    }
    
    console.log("Shop upserted successfully:", { id: shopsRow.id, domain: shopsRow.shopDomain });
    
    // Prepare auth data for upsert - using GraphQL response
    const authData = {
      id: session.shop, // This should be the myshopify domain
      shops: shopsRow.id, // Foreign key to shops table
      shopsGID: shopInfo.id.replace('gid://shopify/Shop/', ''), // Remove GID prefix
      shopName: shopInfo.name || session.shop,
      accessToken: session.accessToken,
      shopifyScope: session.scope || '',
      createDate: now,
      modifiedDate: now,
      created_by: "oauth_callback",
    };
    
    console.log("Upserting auth data:", { 
      ...authData, 
      accessToken: "[REDACTED]" // Don't log the actual token
    });
    
    // Upsert auth data
    const { data: authRow, error: authError } = await supabase
      .from("shopauth")
      .upsert(authData, { onConflict: "id" })
      .select()
      .single();
    
    if (authError) {
      console.error("Auth upsert error:", authError);
      throw new Error(`Auth upsert failed: ${authError.message}`);
    }
    
    console.log("Auth upserted successfully:", { id: authRow.id });
    
    return { shop: shopsRow, auth: authRow };
    
  } catch (error) {
    console.error("Error in storeShopData:", error);
    throw error;
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
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

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Remix app template">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Congrats on creating a new Shopify app 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This embedded app template uses{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/tools/app-bridge"
                      target="_blank"
                      removeUnderline
                    >
                      App Bridge
                    </Link>{" "}
                    interface examples like an{" "}
                    <Link url="/app/additional" removeUnderline>
                      additional page in the app nav
                    </Link>
                    , as well as an{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql"
                      target="_blank"
                      removeUnderline
                    >
                      Admin GraphQL
                    </Link>{" "}
                    mutation demo, to provide a starting point for app
                    development.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Get started with products
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Generate a product with GraphQL and get the JSON output for
                    that product. Learn more about the{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
                      target="_blank"
                      removeUnderline
                    >
                      productCreate
                    </Link>{" "}
                    mutation in our API references.
                  </Text>
                </BlockStack>
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateProduct}>
                    Generate a product
                  </Button>
                  {fetcher.data?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {fetcher.data?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productCreate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.product, null, 2)}
                        </code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantsBulkUpdate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.variant, null, 2)}
                        </code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  <List>
                    <List.Item>
                      Build an{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                        target="_blank"
                        removeUnderline
                      >
                        {" "}
                        example app
                      </Link>{" "}
                      to get started
                    </List.Item>
                    <List.Item>
                      Explore Shopify's API with{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                        target="_blank"
                        removeUnderline
                      >
                        GraphiQL
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Outlet />
    </Page>
  );
}