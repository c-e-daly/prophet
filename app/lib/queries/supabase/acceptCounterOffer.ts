// app/lib/queries/supabase/counterOffers/acceptCounterOffer.ts
import createClient from "../../../../supabase/server";

export async function acceptCounterOffer(
  counterOfferId: number, 
  acceptedAmount: number
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('counterOffers')
    .update({
      offerStatus: 'Consumer Accepted', // Correct column name
      finalAmountCents: acceptedAmount, // Correct column name
      consumerResponseDate: new Date().toISOString(),
      modifedDate: new Date().toISOString(), // Note: typo in your schema "modifedDate"
    })
    .eq('id', counterOfferId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
}

// Separate function since there's no FK to counterTemplates
async function incrementTemplateAcceptance(templateId: number) {
  const supabase = createClient();
  
  const { data: template } = await supabase
    .from('counterTemplates')
    .select('accepted, usage') // Correct column names
    .eq('id', templateId)
    .single();
  
  if (template) {
    const newAccepted = (template.accepted || 0) + 1;
    const acceptRate = (template.usage || 0) > 0 
      ? (newAccepted / (template.usage || 1)) * 100 
      : 0;
    
    await supabase
      .from('counterTemplates')
      .update({ 
        accepted: newAccepted,
        acceptRate,
        modifiedDate: new Date().toISOString(),
      })
      .eq('id', templateId);
  }
}