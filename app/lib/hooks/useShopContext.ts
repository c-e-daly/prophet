// app/lib/hooks/useShopContext.ts
import { useOutletContext } from "@remix-run/react";

export interface ShopContext {
  shop: string;
  shopName: string;
  hasToken: boolean;
}

export function useShopContext(): ShopContext {
  return useOutletContext<ShopContext>();
}
