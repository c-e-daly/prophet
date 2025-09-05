// app/lib/supabase/carts.ts
import { createClient } from "@supabase/supabase-js";

export async function upsertSupabaseCart(args: {
  shopsId: number; consumerId: number; cart: any; // normalized cart
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("carts")
    .upsert({
      shop: args.shopsId,
      consumer: args.consumerId,
      cart_key: args.cart?.id,  // unique key if present
      payload: args.cart,
      modifiedDate: new Date().toISOString(),
    }, { onConflict: "cart_key" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { cartId: data!.id as number };
}

export async function upsertSupabaseCartItems(args: {
  cartId: number; items: any[];
}) {
  const sb = getSb();

  // Option A: simple delete+insert (safe for medium carts)
  await sb.from("cartitems").delete().eq("cart", args.cartId);
  if (args.items?.length) {
    const rows = args.items.map(i => ({
      cart: args.cartId,
      sku: i.sku,
      variantId: i.variantId,
      qty: i.quantity,
      price: i.price,
      payload: i,
    }));
    const { error } = await sb.from("cartitems").insert(rows);
    if (error) throw new Error(error.message);
  }
  return { count: args.items?.length ?? 0 };
}
