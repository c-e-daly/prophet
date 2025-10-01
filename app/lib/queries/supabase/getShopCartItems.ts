// app/lib/queries/getCartItemsForCart.ts
import  createClient  from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";

type CartItemRow = {
  id: number;
  createDate: string | null;
  name: string | null;
  sku: string | null;
  units: number | null;
  unitPrice: number | null; // numeric
  productID: string | null;           // gid://shopify/Product/123...          
};

export async function getCartItemsForCart(
  shopsID: number, 
  cartsID: number
): Promise<CartItemRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cartitems")
    .select(
      "id, createDate, name, sku, units, unitPrice, productID"
    )
    .eq("shops", shopsID)
    .eq("carts", cartsID)
    .order("createDate", { ascending: false });

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
    product_admin_url: toAdminUrl(r.productID),
  }));
}
