// app/lib/hooks/useShopContext.ts
import { useOutletContext } from '@remix-run/react';

interface ShopContext {
  shop: string;
  shopName: string;
  hasToken: boolean;
}

export function useShopContext(): ShopContext {
  return useOutletContext<ShopContext>();
}

// Types for loader functions that need shop data
export interface ShopLoaderArgs {
  shop: string;
  shopName: string;
  hasToken: boolean;
  request: Request;
}

// Utility for loaders that need shop data
export async function getShopFromSession(request: Request) {
  const { authenticate } = await import("../../utils/shopify/shopify.server");
  const { session } = await authenticate.admin(request);
  
  return {
    shop: session.shop,
    shopName: session.shop.replace(".myshopify.com", ""),
    hasToken: !!session.accessToken,
  };
}