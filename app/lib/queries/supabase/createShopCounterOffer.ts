//app/lib/queries/supabase/createShopCOunterOffer.ts
import createClient from "../../../../supabase/server";
import type { CounterOfferRow } from "../../types/dbTables";
import type { CounterType, CounterConfig } from "../../types/counterTypes";

type CreateShopCounterOfferInput = {
  shops: number;
  offers: number;
  counterTemplatesId?: number;
  counterType: CounterType;
  counterConfig: CounterConfig;

  // pricing / analytics
  totalDiscountCents: number;
  counterOfferPrice: number;
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

  // content / workflow
  headline: string;
  description: string;
  reason?: string | null;
  internalNotes?: string | null;
  strategyRationale?: string | null;
  requiresApproval?: boolean;

  createdByUser: number;
  expiresAt?: string | null;
};

export async function createShopCounterOffer(
  input: CreateShopCounterOfferInput
): Promise<CounterOfferRow> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "upsert_shop_counter_offer",
    {
      p_shops_id: input.shops,
      p_offers_id: input.offers,
      p_counter_templates_id: input.counterTemplatesId ?? undefined,
      p_counter_type: input.counterType,
      p_counter_config: input.counterConfig as any,
      p_total_discount_cents: input.totalDiscountCents,
      p_counter_offer_price: input.counterOfferPrice,
      p_estimated_margin_percent: input.estimatedMarginPercent,
      p_estimated_margin_cents: input.estimatedMarginCents,
      p_original_margin_percent: input.originalMarginPercent,
      p_original_margin_cents: input.originalMarginCents,
      p_margin_impact_cents: input.marginImpactCents,
      p_predicted_acceptance_probability: input.predictedAcceptanceProbability,
      p_confidence_score: input.confidenceScore,
      p_prediction_factors: input.predictionFactors,
      p_expected_revenue_cents: input.expectedRevenueCents,
      p_expected_margin_cents: input.expectedMarginCents,
      p_expected_value_score: input.expectedValueScore,
      p_headline: input.headline,
      p_description: input.description,
      p_reason: input.reason  || undefined,
      p_internal_notes: input.internalNotes ?? undefined,
      p_strategy_rationale: input.strategyRationale ?? undefined,
      p_requires_approval: input.requiresApproval ?? false,
      p_created_by_user: input.createdByUser,
      p_expires_at: input.expiresAt ?? undefined,
    }
  );

  if (error) {
    throw new Error(`RPC upsert_shop_counter_offer failed: ${error.message}`);
  }

  // RPC returns SETOF counterOffers → array
  const rows = (Array.isArray(data) ? data : []) as CounterOfferRow[];
  if (!rows.length) throw new Error("No counter offer returned from RPC.");
  return rows[0];
}
