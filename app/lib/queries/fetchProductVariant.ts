// pages/api/fetchProductVariant.js
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";

const PRODUCT_VARIANT_QUERY = gql`
  query getProductsAndVariants($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          productCategory {
            name
          }
          collections(first: 5) {
            edges {
              node {
                id
                title
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryQuantity
                metafields(first: 10, namespace: "iwt") {
                  edges {
                    node {
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  try {
    const session = await getSession(req, res);

    if (!session?.accessToken || !session?.shop) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const client = new GraphQLClient(`https://${session.shop}/admin/api/${LATEST_API_VERSION}/graphql.json`, {
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      },
    });

    const response = await client.request(PRODUCT_VARIANT_QUERY, { first: 25 });

    const parsed = [];

    for (const productEdge of response.products.edges) {
      const product = productEdge.node;

      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;

        const metafields = {};
        for (const mf of variant.metafields.edges) {
          metafields[mf.node.key] = mf.node.value;
        }

        parsed.push({
          productId: product.id,
          title: `${product.title} - ${variant.title}`,
          variant: {
            id: variant.id,
            title: variant.title,
            sku: variant.sku,
            price: variant.price,
            inventoryQuantity: variant.inventoryQuantity,
            cogs: metafields.cogs || "0",
            markup: metafields.markup || "0",
          },
          collectionId: product.collections?.edges?.[0]?.node?.id || null,
          category: product.productCategory?.name || null,
        });
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Error fetching variants:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
