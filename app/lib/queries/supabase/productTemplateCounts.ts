// pages/api/product-template-count.js
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";
import { LATEST_API_VERSION } from "@shopify/shopify-api";

const TEMPLATE_QUERY = gql`
  query GetProductTemplates($cursor: String) {
    products(first: 100, after: $cursor) {
      edges {
        cursor
        node {
          id
          templateSuffix
        }
      }
      pageInfo {
        hasNextPage
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

    const counts = {};
    let cursor = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await client.request(TEMPLATE_QUERY, { cursor });

      const edges = response.products.edges;

      for (const edge of edges) {
        const suffix = edge.node.templateSuffix || "default";
        counts[suffix] = (counts[suffix] || 0) + 1;
      }

      hasNextPage = response.products.pageInfo.hasNextPage;
      cursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
    }

    const result = Object.entries(counts).map(([template, count]) => ({
      template: template === "default" ? "product" : `product.${template}`,
      count,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching template counts:", error);
    return res.status(500).json({ error: "Failed to fetch product templates" });
  }
}
