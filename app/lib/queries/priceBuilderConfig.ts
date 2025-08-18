import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";


const metafieldKeys = [
  {
    key: "cogs",
    name: "Cost of Goods",
    description: "Cost of goods sold",
    type: "number_decimal",
    unit: "CURRENCY",
  },
  {
    key: "markup",
    name: "Profit Markup",
    description: "Markup over COGS",
    type: "number_decimal",
    unit: "PERCENTAGE",
  },
  {
    key: "allowanceDiscounts",
    name: "Discount Allowance",
    description: "Discount allocation",
    type: "number_decimal",
    unit: "PERCENTAGE",
  },
  {
    key: "allowanceShrink",
    name: "Shrink Allowance",
    description: "Loss/shrinkage",
    type: "number_decimal",
    unit: "PERCENTAGE",
  },
  {
    key: "allowanceShipping",
    name: "Shipping Cost Allowance",
    description: "Shipping cost",
    type: "number_decimal",
    unit: "CURRENCY",
  },
  {
    key: "allowanceMarket",
    name: "Market Adjustment Allowance",
    description: "Adjustment based on market trends",
    type: "number_decimal",
    unit: "PERCENTAGE",
  },
];

export default async function priceBuilderConfig({ api, session, params }) {
  const shopify = await api.shopifyShop.maybeFindFirst({
    filter: { id: session.shopifyShopId },
  });

  if (!shopify) throw new Error("Shop not found during pricebuilderInstall");

  const mode = params?.mode || "install";

  if (mode === "install") {
    for (const def of metafieldKeys) {
      await shopify.connection.admin.query(
        gql`
          mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition { id, name }
              userErrors { field message }
            }
          }
        `,
        {
          variables: {
            definition: {
              namespace: "iwt",
              key: def.key,
              name: def.name,
              description: def.description,
              type: def.type,
              ownerType: "PRODUCTVARIANT",
              unit: def.unit,
              visibleToStorefront: false,
              access: {
                admin: "MERCHANT_READ_WRITE",
                storefront: "NONE",
              },
            },
          },
        }
      );
    }

    console.log("✅ Metafield definitions created.");
    return new Response("Metafields created", { status: 200 });
  }

  if (mode === "uninstall") {
    const response = await shopify.connection.admin.query(
      gql`
        query GetDefinitions($namespace: String!) {
          metafieldDefinitions(first: 10, namespace: $namespace) {
            edges {
              node {
                id
                key
              }
            }
          }
        }
      `,
      { variables: { namespace: "iwt" } }
    );

    const existingDefs = response.metafieldDefinitions.edges.map((e) => e.node);

    for (const def of existingDefs) {
      if (metafieldKeys.map((d) => d.key).includes(def.key)) {
        await shopify.connection.admin.query(
          gql`
            mutation DeleteMetafieldDefinition($id: ID!) {
              metafieldDefinitionDelete(id: $id) {
                deletedDefinitionId
                userErrors { field message }
              }
            }
          `,
          { variables: { id: def.id } }
        );
      }
    }

    console.log("🧹 Metafield definitions removed.");
    return new Response("Metafields deleted", { status: 200 });
  }

  return new Response(`Unknown mode: ${mode}`, { status: 400 });
}
