// app/lib/types/shopSession.ts
export type PartialShopSession = {
  // Shopify data (available during install)
  shopDomain: string;
  shopName: string;
  hasToken: boolean;
  
  // Supabase data (not available during install)
  shops?: ShopsRow;
  shopsId?: number;
  shopsBrandName?: string;
};

export type CompleteShopSession = {
  shopDomain: string;
  shopName: string;
  hasToken: boolean;
  shops: ShopsRow;
  shopsId: number;
  shopsBrandName: string;
};

export type ShopSession = PartialShopSession | CompleteShopSession;

// Type guard to check if session is complete
export function isCompleteShopSession(session: ShopSession): session is CompleteShopSession {
  return !!(session.shops && session.shopsId);
}