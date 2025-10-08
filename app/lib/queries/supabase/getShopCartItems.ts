// app/lib/queries/supabase/getShopCartItems.ts
// app/lib/queries/supabase/getShopSingleCart.ts
import createClient from '../../../../supabase/server';
import type { CartRow, ConsumerRow, OfferRow, CartItemWithPricing,  CartDetailsPayload 
} from '../../types/dbTables';

export type CartProfitability = {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  itemsWithPricing: number;
  itemsWithoutPricing: number;
};

export async function getSingleCartDetails(
  shopsID: number,
  cartID: number
): Promise<CartDetailsPayload | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_cart_items', {
    p_shops_id: shopsID,
    p_carts_id: cartID,
  });

  if (error) {
    console.error('Error fetching cart details:', error);
    throw new Error(`Failed to fetch cart details: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const result = (data as unknown) as {
    cart: CartRow | null;
    consumer: ConsumerRow | null;
    offer: OfferRow | null;
    items: CartItemWithPricing[];
  };

  if (!result.cart) {
    return null;
  }

  return {
    cart: result.cart,
    consumer: result.consumer,
    offer: result.offer,
    items: result.items || [],
  };
}

export function cartItemsProfitability(items: CartItemWithPricing[]): CartProfitability {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let itemsWithPricing = 0;
  let itemsWithoutPricing = 0;

  items.forEach((item) => {
    totalRevenue += item.lineTotal;
    
    if (item.lineCost !== null && item.lineProfit !== null) {
      totalCost += item.lineCost;
      totalProfit += item.lineProfit;
      itemsWithPricing++;
    } else {
      itemsWithoutPricing++;
    }
  });

  const averageMargin = totalRevenue > 0 
    ? ((totalProfit / totalRevenue) * 100) 
    : 0;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    averageMargin,
    itemsWithPricing,
    itemsWithoutPricing,
  };
}
