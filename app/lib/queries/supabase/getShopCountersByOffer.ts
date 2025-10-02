// app/lib/queries/supabase/counterOffers/getCounterOffersForOffer.ts
import createClient from "../../../../supabase/server";

export async function getCounterOffersForOffer(shopsID: number, offerId: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('counterOffers')
    .select('*')
    .eq('shops', shopsID)
    .eq('offers', offerId)
    .order('createDate', { ascending: false });
  
  if (error) throw error;
  return data || [];
}