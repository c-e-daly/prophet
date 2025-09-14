
// utils/ShopifyLink.tsx
import { Link, useSearchParams } from "@remix-run/react";
import type { ComponentProps } from "react";

type ShopifyLinkProps = ComponentProps<typeof Link>;

export function ShopifyLink({ to, ...props }: ShopifyLinkProps) {
  const [searchParams] = useSearchParams();
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");
  
  // Handle different 'to' formats
  let basePath: string;
  if (typeof to === "string") {
    basePath = to;
  } else if (typeof to === "object" && to.pathname) {
    basePath = to.pathname;
  } else {
    basePath = "/";
  }
  
  // Build URL with preserved params
  const params = new URLSearchParams();
  if (host) params.set("host", host);
  if (shop) params.set("shop", shop);
  
  const finalUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;
  
  return <Link to={finalUrl} {...props} />;
}