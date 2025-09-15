// app/lib/queries/getCartItemsForCart.ts
import { createClient } from "@supabase/supabase-js";

type CartItemRow = {
  id: number;
  created_date: string | null;
  product_name: string | null;
  variant_sku: string | null;
  variant_quantity: number | null;
  variant_selling_price: number | null; // numeric
  product_gid: string | null;           // gid://shopify/Product/123...
  shopDomain: string | null;             // e.g. "your-shop.myshopify.com"
};

export async function getCartItemsForCart(shopId: number, cartId: number) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
  );

  const { data, error } = await supabase
    .from("cartitems")
    .select(
      "id, created_date, product_name, variant_sku, variant_quantity, variant_selling_price, product_gid, shopDomain"
    )
    .eq("shops", shopId)
    .eq("carts", cartId)
    .order("created_date", { ascending: false });

  if (error) throw error;

  const toAdminUrl = (gid?: string | null, store?: string | null) => {
    const productId = gid?.split("/").pop();
    const shopDomain = (store || "").replace(/^https?:\/\//, "");
    return productId && shopDomain
      ? `https://${shopDomain}/admin/products/${productId}`
      : null;
  };

  return (data ?? []).map((r) => ({
    ...r,
    product_admin_url: toAdminUrl(r.product_gid, r.shopDomain),
  }));
}
