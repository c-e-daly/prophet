// app/lib/calculations/counterofferForecasting.ts
import type { CounterType, CounterConfig, PercentOffOrderConfig, PriceMarkdownOrderConfig,
  ThresholdOneConfig, ThresholdTwoConfig, FlatShippingConfig, BouncebackCurrentConfig,
  BouncebackFutureConfig, } from "../../../lib/types/counterTypes";
import type { PortfolioId } from "../../../lib/types/portfolios";

export type ForecastInput = {
  // Cart data
  cartTotalCents: number;
  cartCostsCents: number;
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
  
  // Historical data
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
  acceptanceProbability: number;
  confidenceScore: number;
  predictionFactors: PredictionFactors;
  
  // Expected value
  expectedRevenueCents: number;
  expectedMarginCents: number;
  expectedValueScore: number;
  
  // Recommendation
  recommendation: "strong_accept" | "accept" | "neutral" | "caution" | "reject";
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
  const originalMarginPercent = originalRevenue > 0 ? (originalMarginCents / originalRevenue) * 100 : 0;
  
  // Calculate discount impact
  const discountCents = calculateDiscountAmount(counterType, counterConfig, cartTotalCents);
  
  // Adjust for shipping changes
  let shippingAdjustment = 0;
  if (counterType === "free_shipping") {
    shippingAdjustment = shippingRevenueCents;
  } else if (counterType === "flat_shipping" && counterConfig.type === "flat_shipping") {
    shippingAdjustment = shippingRevenueCents - (counterConfig.shipping_cost_cents || 0);
  }
  
  // New revenue and margin
  const newRevenue = originalRevenue - discountCents - shippingAdjustment;
  const estimatedMarginCents = newRevenue - totalCosts;
  const estimatedMarginPercent = newRevenue > 0 ? (estimatedMarginCents / newRevenue) * 100 : 0;
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
    case "percent_off_order":
      if (config.type === "percent_off_order") {
        return Math.round(cartTotal * (config.percent / 100));
      }
      return 0;
    
    case "price_markdown_order":
      if (config.type === "price_markdown_order") {
        return config.markdown_cents;
      }
      return 0;
    
    case "bounceback_current":
      // No immediate discount
      return 0;
    
    case "bounceback_future":
      // Future discount - not applied to this order
      return 0;
    
    case "threshold_one":
    case "threshold_two":
      if (config.type === "threshold_one" || config.type === "threshold_two") {
        const applicableThreshold = config.thresholds
          .filter(t => cartTotal >= t.min_spend_cents)
          .sort((a, b) => b.min_spend_cents - a.min_spend_cents)[0];
        
        return applicableThreshold 
          ? Math.round(cartTotal * (applicableThreshold.discount_percent / 100))
          : 0;
      }
      return 0;
    
    case "free_shipping":
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
  const discountPercent = cartTotalCents > 0 ? (discountCents / cartTotalCents) * 100 : 0;
  
  // Factor 1: Portfolio behavior (40% weight)
  const portfolioScore = getPortfolioAcceptanceScore(customerPortfolio);
  
  // Factor 2: Discount depth (25% weight)
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
    marginProtectionWeight: 0,
  };
  
  return {
    probability: Math.max(0.05, Math.min(0.95, probability)),
    confidence,
    factors,
  };
}

/**
 * Portfolio-specific acceptance patterns
 */
function getPortfolioAcceptanceScore(portfolio: PortfolioId): number {
  const PORTFOLIO_ACCEPTANCE_RATES: Record<PortfolioId, number> = {
    new: 0.65,
    reactivated: 0.75,
    stable: 0.70,
    growth: 0.80,
    declining: 0.60,
    defected: 0.45,
  };
  
  return PORTFOLIO_ACCEPTANCE_RATES[portfolio] || 0.50;
}

/**
 * Discount depth effectiveness curve
 */
function calculateDiscountScore(discountPercent: number): number {
  if (discountPercent < 5) return 0.40;
  if (discountPercent < 10) return 0.60;
  if (discountPercent < 15) return 0.80;
  if (discountPercent < 20) return 0.85;
  if (discountPercent < 25) return 0.75;
  if (discountPercent < 30) return 0.65;
  return 0.55;
}

/**
 * Counter type effectiveness by portfolio
 */
function getCounterTypeScore(counterType: CounterType, portfolio: PortfolioId): number {
  const TYPE_PORTFOLIO_FIT: Partial<Record<CounterType, Record<PortfolioId, number>>> = {
    percent_off_order: {
      new: 0.70,
      reactivated: 0.75,
      stable: 0.80,
      growth: 0.85,
      declining: 0.70,
      defected: 0.65,
    },
    bounceback_future: {
      new: 0.60,
      reactivated: 0.85,
      stable: 0.80,
      growth: 0.75,
      declining: 0.90,
      defected: 0.70,
    },
    threshold_two: {
      new: 0.55,
      reactivated: 0.70,
      stable: 0.75,
      growth: 0.90,
      declining: 0.60,
      defected: 0.50,
    },
    free_shipping: {
      new: 0.85,
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
 * Timeliness factor
 */
function getTimelinessScore(daysSinceLastOrder: number, portfolio: PortfolioId): number {
  if (portfolio === "declining" || portfolio === "defected") {
    if (daysSinceLastOrder < 7) return 0.90;
    if (daysSinceLastOrder < 30) return 0.70;
    if (daysSinceLastOrder < 90) return 0.50;
    return 0.30;
  }
  
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
  let confidence = 0.5;
  
  if (lifetimeOrders > 10) confidence += 0.20;
  else if (lifetimeOrders > 5) confidence += 0.15;
  else if (lifetimeOrders > 1) confidence += 0.10;
  
  if (similarCounters > 50) confidence += 0.20;
  else if (similarCounters > 20) confidence += 0.15;
  else if (similarCounters > 5) confidence += 0.10;
  
  if (hasPersonalHistory) confidence += 0.10;
  
  return Math.min(0.95, confidence);
}

/**
 * Calculate expected value and make recommendation
 */
export function calculateExpectedValue(input: ForecastInput): ForecastOutput {
  const marginAnalysis = calculateMarginImpact(input);
  const prediction = predictAcceptanceProbability(input);
  
  const discountCents = calculateDiscountAmount(
    input.counterType,
    input.counterConfig,
    input.cartTotalCents
  );
  
  const finalAmountCents = input.cartTotalCents + input.shippingRevenueCents - discountCents;
  const expectedRevenueCents = Math.round(finalAmountCents * prediction.probability);
  const expectedMarginCents = Math.round(marginAnalysis.estimatedMarginCents * prediction.probability);
  
  const expectedValueScore = 
    (expectedRevenueCents * 0.40) +
    (expectedMarginCents * 0.40) +
    (prediction.probability * 10000 * 0.20);
  
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
 * Generate recommendation
 */
function makeRecommendation(
  marginPercent: number,
  probability: number,
  marginImpact: number
): "strong_accept" | "accept" | "neutral" | "caution" | "reject" {
  if (probability > 0.75 && marginPercent > 25) return "strong_accept";
  if (probability > 0.65 && marginPercent > 15) return "accept";
  if (probability > 0.50 && marginPercent > 10) return "neutral";
  if (marginPercent < 10 || probability < 0.40) return "caution";
  if (marginPercent < 5 || probability < 0.25) return "reject";
  
  return "neutral";
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(
  recommendation: string,
  margin: ReturnType<typeof calculateMarginImpact>,
  prediction: ReturnType<typeof predictAcceptanceProbability>,
  portfolio: PortfolioId
): string {
  const reasons: string[] = [];
  
  if (margin.estimatedMarginPercent > 25) {
    reasons.push(`Strong margin protection (${margin.estimatedMarginPercent.toFixed(1)}%)`);
  } else if (margin.estimatedMarginPercent < 10) {
    reasons.push(`⚠️ Low margin (${margin.estimatedMarginPercent.toFixed(1)}%)`);
  }
  
  if (prediction.probability > 0.75) {
    reasons.push(`High acceptance likelihood (${(prediction.probability * 100).toFixed(0)}%)`);
  } else if (prediction.probability < 0.40) {
    reasons.push(`⚠️ Low acceptance likelihood (${(prediction.probability * 100).toFixed(0)}%)`);
  }
  
  const portfolioLabels: Record<PortfolioId, string> = {
    new: "New customer",
    reactivated: "Recently reactivated",
    stable: "Stable customer",
    growth: "Growing customer",
    declining: "Declining customer",
    defected: "Defected customer",
  };
  
  reasons.push(`${portfolioLabels[portfolio]} segment`);
  
  const marginDollar = margin.estimatedMarginCents / 100;
  reasons.push(`Expected margin: $${marginDollar.toFixed(2)}`);
  
  return reasons.join(" • ");
}