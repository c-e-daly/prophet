// app/lib/queries/supabase/getShopSingleCart.ts
import createClient from '../../../../supabase/server';
import type { CartDetailsPayload } from '../../types/dbTables';  // Changed from ShopSingleCartPayload

export async function getShopSingleCart(
  shopsID: number,
  cartID: number
): Promise<CartDetailsPayload | null> {  // Changed from ShopSingleCartPayload
  const supabase = createClient();

  console.log('[getSingleCartDetails] Calling RPC with:', {
    p_shops_id: shopsID,
    p_carts_id: cartID,
  });

  const { data, error } = await supabase.rpc('get_shop_single_cart', {
    p_shops_id: shopsID,
    p_carts_id: cartID,
  });

  if (error) {
    console.error('Error fetching cart details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(
      `Failed to fetch cart details: ${error.message}` +
      (error.code ? ` [Code: ${error.code}]` : '') +
      (error.details ? ` [Details: ${error.details}]` : '') +
      (error.hint ? ` [Hint: ${error.hint}]` : '')
    );
  }

  if (!data) {
    console.log('[getSingleCartDetails] RPC returned null/undefined');
    return null;
  }

  return (data as unknown) as CartDetailsPayload;  // Changed from ShopSingleCartPayload
}