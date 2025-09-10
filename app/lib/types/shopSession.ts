// app/lib/types/shopSession.ts

import type { Database } from "../../../supabase/database.types";
export type ShopsRow = Database["public"]["Tables"]["shops"]["Row"];

export type CompleteShopSession = {
  // Shopify
  shopDomain: string;     // e.g., "store.myshopify.com"
  shopName: string;       // e.g., "store"
  hasToken: boolean;      // Shopify admin token present

  // Supabase
  shops: ShopsRow;        // full shops row
  shopsID: number;        // canonical internal PK
  shopsBrandName: string; // UI-friendly name

  /** Back-compat alias — do not write to this; use shopsID instead. */
  readonly shopsId?: number;
};

export type ShopSession = CompleteShopSession;

export function isCompleteShopSession(
  session: ShopSession
): session is CompleteShopSession {
  return true;
}

export function makeCompleteShopSession(input: {
  shopDomain: string;
  shopName: string;
  hasToken: boolean;
  shops: ShopsRow;
  shopsID: number;
  shopsBrandName: string;
}): CompleteShopSession {
  const { shopDomain, shopName, hasToken, shops, shopsID, shopsBrandName } = input;
  return {
    shopDomain,
    shopName,
    hasToken,
    shops,
    shopsID,
    shopsBrandName,
    // alias mirrors canonical
    get shopsId() {
      return shopsID;
    },
  } as CompleteShopSession;
}
