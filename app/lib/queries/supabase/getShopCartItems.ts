// app/lib/queries/getCartItemsForCart.ts
import  createClient  from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";

type CartItemRow = {
  id: number;
  createDate: string | null;
  productName: string | null;
  itemSKU: string | null;
  itemQuantity: number | null;
  itemUnitPrice: number | null; // numeric
  productGID: string | null;           // gid://shopify/Product/123...          
};

export async function getCartItemsForCart(
  shopsID: number, 
  cartsID: number
): Promise<CartItemRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cartitems")
    .select(
      "id, createDate, productName, itemSKU, itemQuantity, itemUnitPrice, productGID"
    )
    .eq("shops", shopsID)
    .eq("carts", cartsID)
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
    product_admin_url: toAdminUrl(r.productGID),
  }));
}
