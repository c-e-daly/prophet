// app/lib/queries/supabase/createShopCounterOffer.ts
import createClient from "../../../../supabase/server";

export async function createShopCounterOffer(
  shopsID: number, 
  data: {
    offersID: number;
    counterOfferPrice: number; // The actual price you're countering with
    counterReason?: string;
    internalNotes?: string;
    createdByUserId: number;
  }
) {
  const supabase = createClient();
  
  const { data: counter, error } = await supabase
    .from('counterOffers')
    .insert({
      shops: shopsID,
      offers: data.offersID,
      counterOfferPrice: data.counterOfferPrice,
      counterReason: data.counterReason || null,
      internalNotes: data.internalNotes || null,
      createdByUser: data.createdByUserId,
      createDate: new Date().toISOString(),
      offerStatus: 'Pending',
    })
    .select()
    .single();
   
  if (error) throw error;
  return counter;
}