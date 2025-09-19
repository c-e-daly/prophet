// Minimal Admin GraphQL helper
export async function shopifyGraphQL<T = any>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: any,
  apiVersion = process.env.SHOPIFY_API_VERSION || "2024-10"
): Promise<T & { __httpStatus: number }> {
  const resp = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await resp.json().catch(() => ({}))) as T;
  return Object.assign(body, { __httpStatus: resp.status });
}
