// app/lib/queries/supabase/getShopSingleOffer.ts
import createClient from '../../../../supabase/server';
import type { OfferRow, CartRow, ConsumerRow, ProgramRow, CampaignRow, CounterOfferRow,
  CartItemWithData, ConsumerShop12MRow, ConsumerShopCPMRow, ConsumerShopCPMSRow,
  ConsumerShopLTVRow} from '../../types/dbTables';

export type SingleOfferPayload = {
  offer: OfferRow;
  cart: CartRow | null;
  consumer: ConsumerRow | null;
  program: ProgramRow | null;
  campaign: CampaignRow | null;
  counterOffers: CounterOfferRow[];
  cartItems: CartItemWithData[];
  consumerShop12M: ConsumerShop12MRow | null;
  consumerShopCPM: ConsumerShopCPMRow | null;
  consumerShopCPMS: ConsumerShopCPMSRow | null;
  consumerShopLTV: ConsumerShopLTVRow | null;
};

export async function getShopSingleOffer(
  shopsID: number,
  offerID: number
): Promise<SingleOfferPayload | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_single_offer', {
    p_shops_id: shopsID,
    p_offers_id: offerID,
  });

  if (error) {
    console.error('Error fetching offer:', error);
    throw new Error(`Failed to fetch offer: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const result = (data as unknown) as SingleOfferPayload;

  if (!result.offer) {
    return null;
  }

  return result;
}