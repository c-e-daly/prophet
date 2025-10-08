// app/lib/queries/supabase/getShopSingleOffer.ts
import { callRpcSingle } from './_rpc';
import type { GetShopSingleOfferPayload } from '../../types/dbTables';

export async function getShopSingleOfferRPC(
  shopsID: number,
  offersID: number
): Promise<GetShopSingleOfferPayload> {
  return callRpcSingle<GetShopSingleOfferPayload>('get_shop_single_offer', {
    p_shops_id: shopsID,
    p_offers_id: offersID,
  });
}
