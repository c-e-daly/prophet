// app/lib/supabase/offers.ts
import { getSb } from "./client.server";

export type UpsertOfferArgs = {
  shopsId: number;
  consumerId: number;
  shopifyCustomerGID: string;
  payload: any;          // raw offer JSON (store it)
  code?: string | null;  // discount code if generated
};
export async function upsertSupabaseOffer(args: UpsertOfferArgs) {
  const sb = getSb();
  // idempotency key example: payload?.offerId or hash(payload)
  const key = args.payload?.offerId ?? null;

  const { data, error } = await sb
    .from("offers")
    .upsert({
      shop: args.shopsId,
      consumer: args.consumerId,
      customerGID: args.shopifyCustomerGID,
      payload: args.payload,
      code: args.code ?? null,
      modifiedDate: new Date().toISOString(),
      // offer_key is a unique column for idempotency if you have it
      offer_key: key,
    }, { onConflict: "offer_key" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { offerId: data!.id as number };
}
