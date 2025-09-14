// app/lib/queries/getCartDetails.ts
import  createClient  from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

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
  cart: Tables<"carts">;
  consumer: Tables<"consumers"> | null;
  offer: Tables<"offers"> | null;
  items: Tables<"cartitems">[];
};

export async function getSingleCartDetails(
  shopsId: number,
  idOrToken: number | string,
  opts?: { page?: number; statuses?: string[] }
): Promise<CartDetails | null> {
  const supabase = createClient();

  // 1 Fetch cart detail from supabase carts
  const isNumeric = Number.isFinite(Number(idOrToken));
  const cartQuery = supabase
    .from("carts")
    .select("*")
    .eq("shops", shopsId)
    .limit(1);

  const { data: cartRows, error: cartErr } = isNumeric
    ? await cartQuery.eq("id", Number(idOrToken))
    : await cartQuery.eq("cartToken", String(idOrToken));

  if (cartErr) throw cartErr;
  const cart = cartRows?.[0];
  if (!cart) return null
  
  // 2) Fetch offer (if one exists) – shop-scoped & cart-scoped
  const { data: offer } = await supabase
    .from("offers")
    .select("*")
    .eq("shops", shopsId)
    .eq("carts", cart.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

   // 3) Fetch consumer – shop/consumer linkage as modeled in your schema
  const { data: consumer } = await supabase
    .from("consumers")
    .select("*")
    .eq("shops", shopsId)
    .eq("id", cart.consumers!) // or whatever the FK column is on carts
    .limit(1)
    .maybeSingle();

  // 4) Fetch items
  const { data: items } = await supabase
    .from("cartitems")
    .select("*")
    .eq("shops", shopsId)
    .eq("carts", cart.id)
    .order("id", { ascending: true });

  return { cart, consumer: consumer ?? null, offer: offer ?? null, items: items ?? [] }; 
}
