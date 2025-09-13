// app/components/ShopContextProvider.tsx
import { createContext, useContext, type ReactNode } from "react";

export type ShopData = {
  shopDomain: string;
  shopName: string;
  hasToken: boolean;
  shopsID: number;
  shopsBrandName: string;
};

const ShopContext = createContext<ShopData | null>(null);

export function ShopContextProvider({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: ShopData;
}) {
  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShopData(): ShopData {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShopData must be used within a ShopContextProvider");
  }
  return context;
}

// Convenient hook for just the shopsID
export function useShopsID(): number {
  const { shopsID } = useShopData();
  return shopsID;
}