// app/lib/queries/getCartDetails.ts
import { createClient } from "../../utils/supabase/server";
import type { Tables } from "../types/dbTables";

/** Base table types from your generated helpers */
export type Cart     = Tables<"carts">;
export type CartItem = Tables<"cartitems">;
export type Offer    = Tables<"offers">;
export type Consumer = Tables<"consumers">;
export type Product  = Tables<"products">;
export type Variant  = Tables<"variants">;

/** Expanded item with product + variant */
export type CartItemExpanded = CartItem & {
  product?: Product | null;
  variant?: Variant | null;
};

/** Composite payload we’ll return to the route */
export type CartDetails = {
  cart: Cart;
  consumer: Consumer | null;
  offer: Offer | null;
  items: CartItemExpanded[];
};

export async function getCartDetails(
  shopId: number,
  cartIdOrToken: { id?: number | string; token?: string }
): Promise<CartDetails | null> {
  const supabase = createClient();

  const cart_id = cartIdOrToken.id !== undefined && cartIdOrToken.id !== null
    ? Number(cartIdOrToken.id)
    : null;

  const cart_token = cartIdOrToken.token ?? (typeof cartIdOrToken.id === "string" ? cartIdOrToken.id : null);

  const { data, error } = await supabase.rpc("cart_details_v1", {
    p_shop_id: shopId,
    p_cart_id: cart_id,
    p_cart_token: cart_token,
  });

  if (error) throw new Error(`getCartDetails failed: ${error.message}`);
  if (!data) return null;

  // Trust but type‑narrow: the SQL builds keys 'cart','consumer','offer','items'
  const payload = data as unknown as {
    cart: Cart;
    consumer: Consumer | null;
    offer: Offer | null;
    items: (CartItemExpanded | null)[] | null;
  };

  return {
    cart: payload.cart,
    consumer: payload.consumer ?? null,
    offer: payload.offer ?? null,
    items: (payload.items ?? []).filter(Boolean) as CartItemExpanded[],
  };
}
