// app/lib/queries/supabase/counterOffers/getCounterOffers.ts
import createClient from "../../../../supabase/server";

export async function getCounterOffers(shopsID: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('counterOffers')
    .select(`
      *,
      offers (
        id,
        consumerEmail,
        consumerName,
        cartTotalPrice
      )
    `)
    .eq('shops', shopsID)
    .order('createDate', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map(co => ({
    ...co,
    consumerEmail: co.offers?.consumerEmail,
    consumerName: co.offers?.consumerName,
  }));
}