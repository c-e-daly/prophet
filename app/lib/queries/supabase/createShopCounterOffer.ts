// app/lib/queries/supabase/createShopCounterOffer.ts
import createClient from "../../../../supabase/server";

export async function createShopCounterOffer(shopsID: number, data: {
  offersID: number;
  counterOfferPrice: number; // in cents
  counterReason?: string;
  internalNotes?: string;
  createdByUserId: number;
  counterType?: string;
  counterConfig?: any;
  totalDiscountCents?: number;
  finalAmountCents?: number;
  estimatedMarginPercent?: number; // basis points
  estimatedMarginCents?: number;
  predictedAcceptanceProbability?: number; // permyriad
  confidenceScore?: number; // permyriad
  expectedRevenueCents?: number;
  expectedMarginCents?: number;
}) {
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
      offerStatus: 'Pending Review',
      counterType: data.counterType || null,
      counterConfig: data.counterConfig || null,
      totalDiscountCents: data.totalDiscountCents || null,
      finalAmountCents: data.finalAmountCents || null,
      estimatedMarginPercent: data.estimatedMarginPercent || null,
      estimatedMarginCents: data.estimatedMarginCents || null,
      predictedAcceptanceProbability: data.predictedAcceptanceProbability || null,
      confidenceScore: data.confidenceScore || null,
      expectedRevenueCents: data.expectedRevenueCents || null,
      expectedMarginCents: data.expectedMarginCents || null,
    })
    .select()
    .single();
   
  if (error) throw error;
  return counter;
}