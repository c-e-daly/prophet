import * as React from "react";
import type { CompleteShopSession } from "../lib/types/shopSession";

const ShopSessionContext = React.createContext<CompleteShopSession | null>(null);

export function ShopSessionProvider({
  value,
  children,
}: {
  value: CompleteShopSession;
  children: React.ReactNode;
}) {
  return <ShopSessionContext.Provider value={value}>{children}</ShopSessionContext.Provider>;
}

export function useShopSession() {
  const ctx = React.useContext(ShopSessionContext);
  if (!ctx) throw new Error("useShopSession must be used within ShopSessionProvider");
  return ctx;
}
