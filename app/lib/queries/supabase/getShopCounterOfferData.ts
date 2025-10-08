// app/lib/queries/supabase/getCounterOfferEditorData.ts
import createClient from "../../../../supabase/server";
import type { GetShopCounterOfferEditPayload } from "../../types/dbTables";

type RpcPayload = Partial<GetShopCounterOfferEditPayload>;

export async function getCounterOfferEditorData(
  shopsID: number,
  params: { counterOfferId?: number; offersID?: number }
): Promise<GetShopCounterOfferEditPayload> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_shop_counter_offer_editor_data", {
    p_shops_id: shopsID,
    p_counter_offer_id: params.counterOfferId ?? undefined,
    p_offers_id: params.offersID ?? undefined,
  });
  if (error) throw new Error(`RPC get_shop_counter_offer_editor_data failed: ${error.message}`);

  const p = (data || {}) as RpcPayload;

  if (!p.offers) throw new Error("Offer not found in RPC response.");

  return {
    offers: p.offers,
    carts: p.carts ?? null,
    cartItems: p.cartItems ?? [],
    consumers: p.consumers ?? null,
    consumerShop12M: p.consumerShop12M ?? null,
    consumerShopCPM: p.consumerShopCPM ?? null,
    consumerShopCPMS: p.consumerShopCPMS ?? null,
    consumerShopLTV: p.consumerShopLTV ?? null,
    counterOffers: p.counterOffers ?? null,
  };
}
