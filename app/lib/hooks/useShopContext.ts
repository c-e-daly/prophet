
// app/lib/hooks/useShopContext.ts
import { useOutletContext } from "@remix-run/react";
import type { ShopSession } from "../queries/getShopSession";
export function useShopContext(): ShopSession {
  return useOutletContext<ShopSession>();
}

