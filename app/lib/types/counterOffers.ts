// app/lib/types/counterOffers.ts
import type { CounterType, CounterOfferStatus, CounterConfig } from "./counterTypes";

export type CounterOffer = {
  id: number;
  shops: number;
  offers: number;
  
  counterType: CounterType;
  counterConfig: CounterConfig;
  counterTemplates?: number;
  
  // Pricing
  counterOfferPrice: number;      // Your counter offer amount
  totalDiscountCents: number;      // Discount from original
  acceptedAmountCents?: number;    // Final agreed price (null until accepted)
  
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
  
  // Status & workflow
  status: CounterOfferStatus;
  requiresApproval: boolean;
  approvedByUser?: number;
  approvedAt?: string;
  
  // User tracking
  createdByUser: number;
  
  // Response
  consumerResponseDate?: string;
  consumerResponse?: string;
  
  // Expiration
  expiresAt?: string;
  
  // Timestamps
  createDate: string;
  modifiedDate: string;
};

export type CreateCounterOfferInput = {
  shopsID: number;
  offersID: number;
  counterTemplatesID?: number;
  counterType: string;
  counterConfig: CounterConfig;
  
  counterOfferPrice: number;
  totalDiscountCents: number;
  // acceptedAmountCents NOT in create input - populated later on acceptance
  
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