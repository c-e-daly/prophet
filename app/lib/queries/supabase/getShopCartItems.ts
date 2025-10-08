// app/lib/queries/supabase/getShopCartItems.ts
import createClient from '../../../../supabase/server';
import type { CartRow, ConsumerRow, OfferRow, ProgramRow, CartDetailsPayload,
  CartItemWithData} from '../../types/dbTables';

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
    program: ProgramRow | null;
    items: CartItemWithData[];
  };

  if (!result.cart) {
    return null;
  }

  return {
    cart: result.cart,
    consumer: result.consumer,
    offer: result.offer,
    program: result.program,
    items: result.items || [],
  };
}

/**
 * Calculate profitability metrics - do this in app layer
 */
export function cartProfitability(items: CartItemWithData[]): CartProfitability {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let itemsWithPricing = 0;
  let itemsWithoutPricing = 0;

  items.forEach((item) => {
    const units = item.cartItem.units ?? 0;
    const unitPrice = item.cartItem.unitPrice ?? 0;
    const costPerUnit = item.variantPricing?.itemCost ?? null;
    
    const lineTotal = units * unitPrice;
    totalRevenue += lineTotal;
    
    if (costPerUnit !== null) {
      const lineCost = units * costPerUnit;
      const lineProfit = lineTotal - lineCost;
      
      totalCost += lineCost;
      totalProfit += lineProfit;
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