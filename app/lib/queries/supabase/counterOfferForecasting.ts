// app/lib/calculations/counterofferForecasting.ts
import { CounterType, CounterConfig } from "../../types/counterTypes";
import { PortfolioId } from "../../types/portfolios";

export type ForecastInput = {
  // Cart data
  cartTotalCents: number;
  cartCostsCents: number;  // COGS
  shippingRevenueCents: number;
  shippingCostCents: number;
  
  // Counter details
  counterType: CounterType;
  counterConfig: CounterConfig;
  
  // Customer intelligence
  customerPortfolio: PortfolioId;
  customerLifetimeOrders: number;
  customerAvgOrderValue: number;
  daysSinceLastOrder: number;
  historicalAcceptanceRate?: number;
  
  // Historical data (for ML model)
  similarCountersAccepted: number;
  similarCountersTotal: number;
};

export type ForecastOutput = {
  // Margin analysis
  originalMarginCents: number;
  originalMarginPercent: number;
  estimatedMarginCents: number;
  estimatedMarginPercent: number;
  marginImpactCents: number;
  
  // Probability prediction
  acceptanceProbability: number;  // 0.0 to 1.0
  confidenceScore: number;
  predictionFactors: PredictionFactors;
  
  // Expected value
  expectedRevenueCents: number;
  expectedMarginCents: number;
  expectedValueScore: number;
  
  // Recommendation
  recommendation: 'strong_accept' | 'accept' | 'neutral' | 'caution' | 'reject';
  reasoningText: string;
};

export type PredictionFactors = {
  portfolioWeight: number;
  discountDepthWeight: number;
  customerHistoryWeight: number;
  counterTypeWeight: number;
  timelinessWeight: number;
  marginProtectionWeight: number;
};

/**
 * Calculate margin impact of a counter offer
 */
export function calculateMarginImpact(input: ForecastInput): {
  originalMarginCents: number;
  originalMarginPercent: number;
  estimatedMarginCents: number;
  estimatedMarginPercent: number;
  marginImpactCents: number;
} {
  const {
    cartTotalCents,
    cartCostsCents,
    shippingRevenueCents,
    shippingCostCents,
    counterType,
    counterConfig,
  } = input;
  
  // Original margin (no discount)
  const originalRevenue = cartTotalCents + shippingRevenueCents;
  const totalCosts = cartCostsCents + shippingCostCents;
  const originalMarginCents = originalRevenue - totalCosts;
  const originalMarginPercent = (originalMarginCents / originalRevenue) * 100;
  
  // Calculate discount impact
  const discountCents = calculateDiscountAmount(counterType, counterConfig, cartTotalCents);
  
  // Adjust for shipping changes
  let shippingAdjustment = 0;
  if (counterType === 'free_shipping') {
    shippingAdjustment = shippingRevenueCents;
  } else if (counterType === 'flat_shipping' && 'shipping_cost_cents' in counterConfig) {
    shippingAdjustment = shippingRevenueCents - (counterConfig.shipping_cost_cents || 0);
  }
  
  // New revenue and margin
  const newRevenue = originalRevenue - discountCents - shippingAdjustment;
  const estimatedMarginCents = newRevenue - totalCosts;
  const estimatedMarginPercent = (estimatedMarginCents / newRevenue) * 100;
  const marginImpactCents = originalMarginCents - estimatedMarginCents;
  
  return {
    originalMarginCents,
    originalMarginPercent,
    estimatedMarginCents,
    estimatedMarginPercent,
    marginImpactCents,
  };
}

/**
 * Calculate discount amount based on counter type and config
 */
function calculateDiscountAmount(
  counterType: CounterType,
  config: CounterConfig,
  cartTotal: number
): number {
  switch (counterType) {
    case 'percent_off_order':
      return Math.round(cartTotal * ((config as PercentOffOrderConfig).percent / 100));
    
    case 'price_markdown_order':
      return (config as PriceMarkdownConfig).markdown_cents;
    
    case 'bounceback_current':
      // No immediate discount, but we should factor future cost
      return 0;
    
    case 'bounceback_future':
      // Future discount - not applied to this order
      return 0;
    
    case 'threshold_one':
    case 'threshold_two': {
      const thresholds = (config as ThresholdConfig).thresholds;
      const applicableThreshold = thresholds
        .filter(t => cartTotal >= t.min_spend_cents)
        .sort((a, b) => b.min_spend_cents - a.min_spend_cents)[0];
      
      return applicableThreshold 
        ? Math.round(cartTotal * (applicableThreshold.discount_percent / 100))
        : 0;
    }
    
    case 'free_shipping':
      return 0; // Handled separately in margin calc
    
    default:
      return 0;
  }
}

/**
 * Predict acceptance probability based on multiple factors
 */
export function predictAcceptanceProbability(input: ForecastInput): {
  probability: number;
  confidence: number;
  factors: PredictionFactors;
} {
  const {
    customerPortfolio,
    customerLifetimeOrders,
    daysSinceLastOrder,
    counterType,
    counterConfig,
    cartTotalCents,
    historicalAcceptanceRate,
    similarCountersAccepted,
    similarCountersTotal,
  } = input;
  
  // Calculate discount depth
  const discountCents = calculateDiscountAmount(counterType, counterConfig, cartTotalCents);
  const discountPercent = (discountCents / cartTotalCents) * 100;
  
  // Factor 1: Portfolio behavior (40% weight)
  const portfolioScore = getPortfolioAcceptanceScore(customerPortfolio);
  
  // Factor 2: Discount depth (25% weight)
  // Sweet spot: 10-20% discount has highest acceptance
  const discountScore = calculateDiscountScore(discountPercent);
  
  // Factor 3: Customer history (20% weight)
  const historyScore = historicalAcceptanceRate || 
    (similarCountersTotal > 0 ? similarCountersAccepted / similarCountersTotal : 0.5);
  
  // Factor 4: Counter type effectiveness (10% weight)
  const typeScore = getCounterTypeScore(counterType, customerPortfolio);
  
  // Factor 5: Timeliness (5% weight)
  const timelinessScore = getTimelinessScore(daysSinceLastOrder, customerPortfolio);
  
  // Weighted probability
  const probability = 
    portfolioScore * 0.40 +
    discountScore * 0.25 +
    historyScore * 0.20 +
    typeScore * 0.10 +
    timelinessScore * 0.05;
  
  // Confidence based on data availability
  const confidence = calculateConfidence(
    customerLifetimeOrders,
    similarCountersTotal,
    !!historicalAcceptanceRate
  );
  
  const factors: PredictionFactors = {
    portfolioWeight: portfolioScore,
    discountDepthWeight: discountScore,
    customerHistoryWeight: historyScore,
    counterTypeWeight: typeScore,
    timelinessWeight: timelinessScore,
    marginProtectionWeight: 0, // Calculated separately
  };
  
  return {
    probability: Math.max(0.05, Math.min(0.95, probability)), // Bound between 5-95%
    confidence,
    factors,
  };
}

/**
 * Portfolio-specific acceptance patterns
 */
function getPortfolioAcceptanceScore(portfolio: PortfolioType): number {
  const PORTFOLIO_ACCEPTANCE_RATES = {
    new: 0.65,        // New customers are cautious but interested
    reactivated: 0.75, // Recently returned, want to stay engaged
    stable: 0.70,      // Consistent, predictable
    growth: 0.80,      // Growing spend, receptive to deals
    declining: 0.60,   // Harder to win back, need strong offers
    defected: 0.45,    // Very hard to reactivate
  };
  
  return PORTFOLIO_ACCEPTANCE_RATES[portfolio] || 0.50;
}

/**
 * Discount depth effectiveness curve
 */
function calculateDiscountScore(discountPercent: number): number {
  if (discountPercent < 5) return 0.40;   // Too small, not compelling
  if (discountPercent < 10) return 0.60;  // Okay, but minimal
  if (discountPercent < 15) return 0.80;  // Sweet spot begins
  if (discountPercent < 20) return 0.85;  // Optimal range
  if (discountPercent < 25) return 0.75;  // Still good
  if (discountPercent < 30) return 0.65;  // Diminishing returns
  return 0.55; // Too high, seems desperate or suspicious
}

/**
 * Counter type effectiveness by portfolio
 */
function getCounterTypeScore(counterType: CounterType, portfolio: PortfolioType): number {
  // Different counter types work better for different portfolios
  const TYPE_PORTFOLIO_FIT = {
    // Immediate discounts
    percent_off_order: {
      new: 0.70,
      reactivated: 0.75,
      stable: 0.80,
      growth: 0.85,
      declining: 0.70,
      defected: 0.65,
    },
    // Future incentives (bounceback)
    bounceback_future: {
      new: 0.60,         // Unproven, may not return
      reactivated: 0.85, // Perfect for keeping them engaged
      stable: 0.80,      // Good for retention
      growth: 0.75,      // Less needed
      declining: 0.90,   // Excellent for reactivation
      defected: 0.70,    // Worth trying
    },
    // Threshold deals
    threshold_two: {
      new: 0.55,
      reactivated: 0.70,
      stable: 0.75,
      growth: 0.90,      // Perfect for increasing AOV
      declining: 0.60,
      defected: 0.50,
    },
    // Shipping
    free_shipping: {
      new: 0.85,         // Very effective for first order
      reactivated: 0.75,
      stable: 0.70,
      growth: 0.65,
      declining: 0.75,
      defected: 0.70,
    },
  };
  
  return TYPE_PORTFOLIO_FIT[counterType]?.[portfolio] || 0.70;
}

/**
 * Timeliness factor - respond quickly, higher acceptance
 */
function getTimelinessScore(daysSinceLastOrder: number, portfolio: PortfolioType): number {
  if (portfolio === 'declining' || portfolio === 'defected') {
    // For at-risk customers, urgency matters more
    if (daysSinceLastOrder < 7) return 0.90;
    if (daysSinceLastOrder < 30) return 0.70;
    if (daysSinceLastOrder < 90) return 0.50;
    return 0.30;
  }
  
  // For healthy customers, less time-sensitive
  return 0.75;
}

/**
 * Confidence score based on available data
 */
function calculateConfidence(
  lifetimeOrders: number,
  similarCounters: number,
  hasPersonalHistory: boolean
): number {
  let confidence = 0.5; // Base confidence
  
  // More customer history = higher confidence
  if (lifetimeOrders > 10) confidence += 0.20;
  else if (lifetimeOrders > 5) confidence += 0.15;
  else if (lifetimeOrders > 1) confidence += 0.10;
  
  // Similar counter data
  if (similarCounters > 50) confidence += 0.20;
  else if (similarCounters > 20) confidence += 0.15;
  else if (similarCounters > 5) confidence += 0.10;
  
  // Personal acceptance history
  if (hasPersonalHistory) confidence += 0.10;
  
  return Math.min(0.95, confidence);
}

/**
 * Calculate expected value and make recommendation
 */
export function calculateExpectedValue(input: ForecastInput): ForecastOutput {
  // Calculate margins
  const marginAnalysis = calculateMarginImpact(input);
  
  // Predict probability
  const prediction = predictAcceptanceProbability(input);
  
  // Expected value calculations
  const finalAmountCents = input.cartTotalCents + input.shippingRevenueCents - 
    calculateDiscountAmount(input.counterType, input.counterConfig, input.cartTotalCents);
  
  const expectedRevenueCents = Math.round(finalAmountCents * prediction.probability);
  const expectedMarginCents = Math.round(marginAnalysis.estimatedMarginCents * prediction.probability);
  
  // Weighted score: balance revenue, margin, and probability
  const expectedValueScore = 
    (expectedRevenueCents * 0.40) +  // 40% weight on revenue
    (expectedMarginCents * 0.40) +   // 40% weight on margin
    (prediction.probability * 10000 * 0.20); // 20% weight on probability
  
  // Make recommendation
  const recommendation = makeRecommendation(
    marginAnalysis.estimatedMarginPercent,
    prediction.probability,
    marginAnalysis.marginImpactCents
  );
  
  const reasoningText = generateReasoning(
    recommendation,
    marginAnalysis,
    prediction,
    input.customerPortfolio
  );
  
  return {
    ...marginAnalysis,
    acceptanceProbability: prediction.probability,
    confidenceScore: prediction.confidence,
    predictionFactors: prediction.factors,
    expectedRevenueCents,
    expectedMarginCents,
    expectedValueScore,
    recommendation,
    reasoningText,
  };
}

/**
 * Generate recommendation based on forecasts
 */
function makeRecommendation(
  marginPercent: number,
  probability: number,
  marginImpact: number
): 'strong_accept' | 'accept' | 'neutral' | 'caution' | 'reject' {
  // Strong Accept: High probability + Good margin
  if (probability > 0.75 && marginPercent > 25) return 'strong_accept';
  
  // Accept: Good probability + Acceptable margin
  if (probability > 0.65 && marginPercent > 15) return 'accept';
  
  // Neutral: Moderate probability and margin
  if (probability > 0.50 && marginPercent > 10) return 'neutral';
  
  // Caution: Low margin or low probability
  if (marginPercent < 10 || probability < 0.40) return 'caution';
  
  // Reject: Very low margin or very low probability
  if (marginPercent < 5 || probability < 0.25) return 'reject';
  
  return 'neutral';
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(
  recommendation: string,
  margin: ReturnType<typeof calculateMarginImpact>,
  prediction: ReturnType<typeof predictAcceptanceProbability>,
  portfolio: PortfolioType
): string {
  const reasons: string[] = [];
  
  // Margin reasoning
  if (margin.estimatedMarginPercent > 25) {
    reasons.push(`Strong margin protection (${margin.estimatedMarginPercent.toFixed(1)}%)`);
  } else if (margin.estimatedMarginPercent < 10) {
    reasons.push(`⚠️ Low margin (${margin.estimatedMarginPercent.toFixed(1)}%)`);
  }
  
  // Probability reasoning
  if (prediction.probability > 0.75) {
    reasons.push(`High acceptance likelihood (${(prediction.probability * 100).toFixed(0)}%)`);
  } else if (prediction.probability < 0.40) {
    reasons.push(`⚠️ Low acceptance likelihood (${(prediction.probability * 100).toFixed(0)}%)`);
  }
  
  // Portfolio context
  const portfolioLabels = {
    new: 'New customer',
    reactivated: 'Recently reactivated',
    stable: 'Stable customer',
    growth: 'Growing customer',
    declining: 'Declining customer',
    defected: 'Defected customer',
  };
  reasons.push(`${portfolioLabels[portfolio]} segment`);
  
  // Expected value
  const marginDollar = margin.estimatedMarginCents / 100;
  reasons.push(`Expected margin: ${marginDollar.toFixed(2)}`);
  
  return reasons.join(' • ');
}
```

```typescript
// Auto-suggest best counter based on:
// - Customer portfolio (declining needs bounceback)
// - Cart value (high value gets threshold deals)
// - Margin (protect margins with future incentives)
// - Historical acceptance rates

async function suggestCounterOffer(
  offer: Offer,
  consumer: Consumer,
  portfolio: PortfolioType
): Promise<CounterTemplate[]> {
  // Your ML/rules engine recommends:
  // "This declining customer with $450 cart (35% margin) 
  //  should get: 15% off today + $25 off next $100"
  
  return rankedTemplates;
}