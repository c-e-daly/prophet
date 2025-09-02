import type { Database } from "../../../supabase/database.types";
type ShopsRow = Database["public"]["Tables"]["shops"]["Row"];

export type ShopSession = {
  // Shopify Admin
  shopDomain: string;
  shopName: string;
  hasToken: boolean;

  // Supabase
  shops: ShopsRow;
  shopsId: number;
  shopsBrandName: string;
};

export async function getShopSession(request: Request): Promise<ShopSession> {
  const { authenticate } = await import("../../utils/shopify/shopify.server");
  const { createClient } = await import("../../utils/supabase/server");

  // From Shopify
  const { session } = await authenticate.admin(request);
  if (!session?.shop) throw new Response("Unauthorized", { status: 401 });
  const shopDomain = session.shop;
  const shopName = shopDomain.replace(".myshopify.com", "");
  const hasToken = !!session.accessToken;

  // From Supabase
  const supabase = createClient();
  const { data: shops, error } = await supabase
    .from("shops")
    .select("*")
    .eq("shopDomain", shopDomain)
    .single();

  if (error || !shops) {
    throw new Response(`Shop not found in DB for ${shopDomain}`, { status: 404 });
  }

  return {
    shopDomain,
    shopName,
    hasToken,
    shops,
    shopsId: shops.id,
    shopsBrandName: shops.brandName ?? shopName,
  };
}
