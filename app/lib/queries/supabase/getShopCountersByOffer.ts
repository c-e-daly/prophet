// app/lib/queries/supabase/counterOffers/getCounterOffersForOffer.ts
import createClient from "../../../../supabase/server";

export async function getCounterOffersForOffer(shopsID: number, offersID: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('counterOffers')
    .select('*')
    .eq('shops', shopsID)
    .eq('offers', offersID)
    .order('createDate', { ascending: false });
  
  if (error) throw error;
  return data || [];
}