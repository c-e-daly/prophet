// app/lib/queries/supabase/counterOffers/createCounterOffer.ts
import createClient from "../../../../supabase/server";
import type { CounterConfig } from "../../types/counterTypes";

type CreateCounterOfferInput = {
  shopsID: number;
  offersID: number;
  counterTemplatesID?: number;
  counterType: string;
  counterConfig: CounterConfig;
  totalDiscountCents: number;
  finalAmountCents: number;
  counterOfferPrice: number; // ADD THIS - it's required in your DB
  estimatedMarginPercent: number;
  estimatedMarginCents: number;
  originalMarginPercent: number;
  originalMarginCents: number;
  marginImpactCents: number;
  predictedAcceptanceProbability: number;
  confidenceScore: number;
  predictionFactors: any;
  expectedRevenueCents: number;
  expectedMarginCents: number;
  expectedValueScore: number;
  headline: string;
  description: string;
  reason?: string;
  internalNotes?: string;
  strategyRationale?: string;
  requiresApproval?: boolean;
  createdByUserID: number;
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
    acceptedAmount: null,
    counterOfferPrice: input.counterOfferPrice, // ADD THIS
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
    requiresApproval: input.requiresApproval || false, 
    createdByUser: input.createdByUserID, 
    expiresAt: input.expiresAt || null,   
    createDate: new Date().toISOString(), // Changed from createdDate
    modifiedDate: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('counterOffers')
    .insert(row)
    .select()
    .single();
  
  if (error) throw error;
  
  // If using a template, increment usage counter
  if (input.counterTemplatesID) {
    await incrementTemplateUsage(input.counterTemplatesID);
  }
  
  return data;
}

// Helper function to increment template usage
async function incrementTemplateUsage(templateId: number) {
  const supabase = createClient();
  
  const { data: template } = await supabase
    .from('counterTemplates')
    .select('usage')
    .eq('id', templateId)
    .single();
  
  if (template) {
    await supabase
      .from('counterTemplates')
      .update({ 
        timesUsed: (template.usage || 0) + 1,
        modifiedDate: new Date().toISOString()
      })
      .eq('id', templateId);
  }
}