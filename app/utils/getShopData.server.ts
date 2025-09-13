// app/lib/utils/getShopData.server.ts
import { authenticate } from "../utils/shopify/shopify.server";
import createClient from "../utils/supabase/server";
import type { CompleteShopSession } from "../../app//lib//types/shopSession";

export async function getShopData(request: Request): Promise<CompleteShopSession> {
  const { session } = await authenticate.admin(request);
  
  if (!session?.shop) {
    throw new Error("No shop session found");
  }

  const supabase = createClient();
  
  // Get shop data from your database
  const { data: shopsRow, error } = await supabase
    .from("shops")
    .select("*")
    .eq("shopDomain", session.shop)
    .single();

  if (error || !shopsRow) {
    throw new Error("Shop not found in database");
  }

  return {
    shopDomain: session.shop,
    shopName: session.shop.replace(".myshopify.com", ""),
    hasToken: !!session.accessToken,
    shops: shopsRow,
    shopsID: shopsRow.id,
    shopsBrandName: shopsRow.brandName ?? '',
  };
}