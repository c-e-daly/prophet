// app/lib/hooks/useShopContext.server.ts
export async function getShopFromSession(request: Request) {
  const { authenticate } = await import("../../utils/shopify/shopify.server");
  const { session } = await authenticate.admin(request);
  return {
    shop: session.shop,
    shopName: session.shop.replace(".myshopify.com", ""),
    hasToken: !!session.accessToken,
  };
}

export async function getShopIdFromSupabase(shop: string): Promise<number> {
  const { createClient } = await import("../../utils/supabase/server");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("id")
    .eq("storeUrl", shop)
    .single();

  if (error || !data) {
    throw new Error(`Shop not found in database: ${shop}`);
  }
  return data.id;
}

export async function getShopAndIdFromSession(request: Request) {
  const { shop, shopName, hasToken } = await getShopFromSession(request);
  const shopsId = await getShopIdFromSupabase(shop);
  return { shop, shopName, hasToken, shopsId };
}
