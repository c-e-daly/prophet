// app/lib/hooks/useShopContext.ts
import { useOutletContext } from "@remix-run/react";
import type { ShopSession } from "../types/shopSession";
import { isCompleteShopSession } from "../types/shopSession";

type OutletContext = {
  shopSession: ShopSession;
  isInstallFlow: boolean;
};

export function useShopContext() {
  const context = useOutletContext<OutletContext>();
  
  if (!context?.shopSession) {
    throw new Error("useShopContext must be used within a route with shop session context");
  }
  
  return {
    shopSession: context.shopSession,
    isInstallFlow: context.isInstallFlow,
    isComplete: isCompleteShopSession(context.shopSession),
    // Helper getters with type safety
    get shopsId() {
      if (!isCompleteShopSession(context.shopSession)) {
        throw new Error("shopsId not available during install flow");
      }
      return context.shopSession.shopsId;
    },
    get shopsBrandName() {
      return isCompleteShopSession(context.shopSession) 
        ? context.shopSession.shopsBrandName 
        : context.shopSession.shopName;
    }
  };
}
