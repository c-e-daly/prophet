// app/lib/queries/createShopCounterOffer.ts
import createClient from "../../../utils/supabase/admin";

const supabase = createClient();

type Input = { offerId: number; amountCents: number; reason?: string | null };

export async function createShopCounterOffer(shopId: number, input: Input): Promise<number> {
  const row = {
    shop: shopId,
    offer: input.offerId,
    amount_cents: input.amountCents,
    reason: input.reason ?? null,
    created_date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("counteroffers")
    .insert(row)
    .select("id")
    .single();

  if (error) throw error;
  return data!.id as number;
}
