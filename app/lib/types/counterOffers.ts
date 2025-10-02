// app/lib/types/counterOffers.ts


export type CounterType = 
  | 'percent_off_item'
  | 'percent_off_order'
  | 'percent_off_next_order'
  | 'price_markdown'
  | 'price_markdown_order'
  | 'bounceback_current'
  | 'bounceback_future'
  | 'threshold_one'
  | 'threshold_two'
  | 'purchase_with_purchase'
  | 'gift_with_purchase'
  | 'flat_shipping'
  | 'free_shipping'
  | 'flat_shipping_upgrade'
  | 'price_markdown_per_unit'
  | 'price_markdown_bundle';

export type CounterOfferStatus = 
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

// Base counter offer (what gets saved to DB)
export type CounterOffer = {
  id: number;
  shopsID: number;
  offers: number; // FK to offers table
  
  // Strategy
  counterType: CounterType;
  counterConfig: CounterConfig;
  
  // Template reference (optional)
  counterTemplates?: number;
  
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
  predictionFactors: any; // JSONB
  
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
  customerRespondedAt?: string;
  customerResponse?: string;
  
  // Expiration
  expiresAt?: string;
  
  // Timestamps
  createdDate: string;
  modifiedDate: string;
};

// Config types for each counter type
export type CounterConfig = 
  | BouncebackFutureConfig
  | BouncebackCurrentConfig
  | ThresholdConfig
  | PercentOffOrderConfig
  | GiftWithPurchaseConfig
  | PriceMarkdownPerUnitConfig;

export type BouncebackFutureConfig = {
  type: 'bounceback_future';
  spend_threshold_cents: number;
  reward_cents: number;
  next_order_threshold_cents: number;
  validity_days: number;
  from_date: 'order_date' | 'counter_accepted';
};

export type BouncebackCurrentConfig = {
  type: 'bounceback_current';
  spend_threshold_cents: number;
  reward_cents: number;
  validity_days: number;
};

export type ThresholdConfig = {
  type: 'threshold_one' | 'threshold_two';
  thresholds: Array<{
    min_spend_cents: number;
    discount_percent?: number;
    discount_cents?: number;
  }>;
};

export type PercentOffOrderConfig = {
  type: 'percent_off_order';
  percent: number;
};

export type GiftWithPurchaseConfig = {
  type: 'gift_with_purchase';
  min_spend_cents: number;
  gift_product_id: string;
  gift_value_cents: number;
};

export type PriceMarkdownPerUnitConfig = {
  type: 'price_markdown_per_unit';
  quantity_tiers: Array<{
    min_quantity: number;
    discount_percent: number;
  }>;
};