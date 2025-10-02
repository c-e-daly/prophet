// app/lib/queries/supabase/counterOffers/createCounterOffer.ts
import createClient from "../../../../supabase/server";
import type { CounterOffer, CounterConfig } from "../../types/counterOffers";

type CreateCounterOfferInput = {
  shopsID: number;
  offersID: number;
  counterTemplatesID?: number; // Optional: if using a template
  
  counterType: string;
  counterConfig: CounterConfig;
  
  // Calculated values
  totalDiscountCents: number;
  finalAmountCents: number;
  
  // Financial forecasting
  estimatedMarginPercent: number;
  estimatedMarginCents: number;
  originalMarginPercent: number;
  originalMarginCents: number;
  marginImpactCents: number;
  
  // Probability forecasting
  predictedAcceptanceProbability: number;
  confidenceScore: number;
  predictionFactors: any;
  
  // Expected value
  expectedRevenueCents: number;
  expectedMarginCents: number;
  expectedValueScore: number;
  
  // Customer-facing
  headline: string;
  description: string;
  reason?: string;
  
  // Internal
  internalNotes?: string;
  strategyRationale?: string;
  
  // User
  createdByUserID: number;
  
  // Expiration
  expiresAt?: string;
};

export async function createCounterOffer(input: CreateCounterOfferInput) {
  const supabase = createClient();
  
  const row = {
    shops: input.shopsID,
    offers: input.offersID,
    counterTemplates: input.counterTemplatesID || null,
    counterType: input.counterType,
    counterConfig: input.counterConfig,
    totalDiscountCents: input.totalDiscountCents,
    finalAmountCents: input.finalAmountCents,
    estimatedMarginPercent: input.estimatedMarginPercent,
    estimatedMarginCents: input.estimatedMarginCents,
    originalMarginPercent: input.originalMarginPercent,
    originalMarginCents: input.originalMarginCents,
    marginImpactCents: input.marginImpactCents, 
    predictedAcceptanceProbability: input.predictedAcceptanceProbability,
    confidenceScore: input.confidenceScore,
    predictionFactors: input.predictionFactors, 
    expectedRevenueCents: input.expectedRevenueCents,
    expectedMarginCents: input.expectedMarginCents,
    expectedValueScore: input.expectedValueScore,  
    headline: input.headline,
    description: input.description,
    reason: input.reason || null,
    internalNotes: input.internalNotes || null,
    strategyRationale: input.strategyRationale || null,
    status: 'draft' as const,
    requiresApproval: false, 
    createdByUser: input.createdByUserID, 
    expiresAt: input.expiresAt || null,   
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('counterOffers')
    .insert(row)
    .select()
    .single();
  
  if (error) throw error;
  
  
// If using a template, increment usage counter via RPC
if (input.counterTemplatesID) {
  await supabase.rpc('increment_counter_template_usage', {
    template_id: input.counterTemplatesID
  });
}
}