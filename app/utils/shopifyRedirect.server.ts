// utils/shopifyRedirect.server.ts
export function buildShopifyRedirectUrl(
  request: Request, 
  basePath: string, 
  additionalParams?: URLSearchParams
): string {
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  const shop = url.searchParams.get("shop");
  
  // Build URL with preserved Shopify params
  const params = new URLSearchParams();
  if (host) params.set("host", host);
  if (shop) params.set("shop", shop);
  
  // Add any additional parameters
  if (additionalParams) {
    additionalParams.forEach((value, key) => {
      params.set(key, value);
    });
  }
  
  return params.toString() ? `${basePath}?${params.toString()}` : basePath;
}