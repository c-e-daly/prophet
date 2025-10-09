// app/lib/queries/supabase/getShopSingleOffer.ts
import createClient from '../../../../supabase/server';
import type { ShopSingleOfferPayload } from '../../types/dbTables';

export async function getShopSingleOffer(
  shopsID: number,
  offersID: number
): Promise<ShopSingleOfferPayload | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_single_offer', {
    p_shops_id: shopsID,
    p_offers_id: offersID,
  });

   if (error) {
   console.error('Error fetching offer details:', {
     message: error.message,
     code: error.code,
     details: error.details,
     hint: error.hint,
     fullError: error,
   });
 }
  
  if (!data) {
    return null;
  }

  // Cast properly
  return (data as unknown) as ShopSingleOfferPayload;
}