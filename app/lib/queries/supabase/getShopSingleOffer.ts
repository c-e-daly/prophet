// app/lib/queries/supabase/getShopSingleOffer.ts
// app/lib/queries/supabase/getShopSingleOffer.ts
import createClient from '../../../../supabase/server';
import type { ShopSingleOfferPayload } from '../../types/dbTables';

export async function getShopSingleOffer(
  shopsID: number,
  offerID: number
): Promise<ShopSingleOfferPayload | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_single_offer', {
    p_shops_id: shopsID,
    p_offers_id: offerID,
  });

  if (error) {
    console.error('Error fetching offer details:', error);
    throw new Error(`Failed to fetch offer details: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Cast properly
  return (data as unknown) as ShopSingleOfferPayload;
}