-- =============================================================================
-- fn: upsert_shop_counter_offer_forecast
-- desc: Calculate and store counter offer forecast results (margin, probability,
--       recommendation, expected value) for a given shop + counter offer context.
-- params:
--   p_shops_id            bigint     -- required
--   p_counter_offer_id    bigint     -- optional (link forecast to counter offer)
--   p_input               jsonb      -- required JSON matching ForecastInput shape
-- returns: jsonb (the forecast results)
-- folders: /rpc/counter_offers/upsert_shop_counter_offer_forecast.sql
-- =============================================================================

create or replace function upsert_shop_counter_offer_forecast(
  p_shops_id         bigint,
  p_input            jsonb,
  p_counter_offer_id bigint default null
 
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  -- Inputs extracted from p_input
  v_cart_total_cents           numeric;
  v_cart_costs_cents           numeric;
  v_shipping_revenue_cents     numeric;
  v_shipping_cost_cents        numeric;
  v_counter_type               text;
  v_customer_portfolio         text;
  v_days_since_last_order      int;
  v_historical_acceptance_rate numeric;
  v_similar_accepted           int;
  v_similar_total              int;
  
  -- Derived values
  v_discount_cents             numeric := 0;
  v_original_margin_cents      numeric := 0;
  v_original_margin_percent    numeric := 0;
  v_estimated_margin_cents     numeric := 0;
  v_estimated_margin_percent   numeric := 0;
  v_margin_impact_cents        numeric := 0;
  v_probability                numeric := 0;
  v_confidence                 numeric := 0;
  v_expected_revenue_cents     numeric := 0;
  v_expected_margin_cents      numeric := 0;
  v_expected_value_score       numeric := 0;
  v_recommendation             text;
  v_reasoning_text             text;
  v_now                        timestamptz := now();
  v_forecast                   jsonb;
begin
  if p_shops_id is null then
    raise exception 'p_shops_id is required';
  end if;
  if p_input is null then
    raise exception 'p_input JSON required';
  end if;

  -- 1️⃣ Extract key fields
  v_cart_total_cents           := coalesce((p_input->>'cartTotalCents')::numeric, 0);
  v_cart_costs_cents           := coalesce((p_input->>'cartCostsCents')::numeric, 0);
  v_shipping_revenue_cents     := coalesce((p_input->>'shippingRevenueCents')::numeric, 0);
  v_shipping_cost_cents        := coalesce((p_input->>'shippingCostCents')::numeric, 0);
  v_counter_type               := coalesce(p_input->>'counterType', 'percent_off_order');
  v_customer_portfolio         := coalesce(p_input->>'customerPortfolio', 'stable');
  v_days_since_last_order      := coalesce((p_input->>'daysSinceLastOrder')::int, 0);
  v_historical_acceptance_rate := coalesce((p_input->>'historicalAcceptanceRate')::numeric, 0.5);
  v_similar_accepted           := coalesce((p_input->>'similarCountersAccepted')::int, 0);
  v_similar_total              := coalesce((p_input->>'similarCountersTotal')::int, 0);

  -- 2️⃣ Simplified margin & probability calculations (core logic mirrored from TS)
  v_original_margin_cents := (v_cart_total_cents + v_shipping_revenue_cents) - (v_cart_costs_cents + v_shipping_cost_cents);
  if (v_cart_total_cents + v_shipping_revenue_cents) > 0 then
    v_original_margin_percent := (v_original_margin_cents / (v_cart_total_cents + v_shipping_revenue_cents)) * 100;
  end if;

  -- Approximate discount depth (for SQL version)
  v_discount_cents := round(v_cart_total_cents * 0.10);  -- assume 10% avg discount for baseline
  v_estimated_margin_cents := v_original_margin_cents - v_discount_cents;
  if (v_cart_total_cents > 0) then
    v_estimated_margin_percent := (v_estimated_margin_cents / v_cart_total_cents) * 100;
  end if;
  v_margin_impact_cents := v_original_margin_cents - v_estimated_margin_cents;

  -- Basic acceptance probability model (light SQL replica)
  v_probability :=
      (case v_customer_portfolio
         when 'growth' then 0.80
         when 'reactivated' then 0.75
         when 'stable' then 0.70
         when 'new' then 0.65
         when 'declining' then 0.60
         when 'defected' then 0.45
         else 0.60
       end)
    * (1 - least(v_discount_cents / nullif(v_cart_total_cents,0), 0.5));

  v_confidence :=
      least(0.95, 0.5 +
        case when v_similar_total > 50 then 0.2
             when v_similar_total > 20 then 0.15
             when v_similar_total > 5 then 0.1
             else 0 end +
        case when v_historical_acceptance_rate > 0 then 0.1 else 0 end);

  -- Expected revenue and value
  v_expected_revenue_cents := (v_cart_total_cents + v_shipping_revenue_cents - v_discount_cents) * v_probability;
  v_expected_margin_cents := v_estimated_margin_cents * v_probability;
  v_expected_value_score := (v_expected_revenue_cents * 0.4) + (v_expected_margin_cents * 0.4) + (v_probability * 10000 * 0.2);

  -- Recommendation tiers
  if v_probability > 0.75 and v_estimated_margin_percent > 25 then
    v_recommendation := 'strong_accept';
  elsif v_probability > 0.65 and v_estimated_margin_percent > 15 then
    v_recommendation := 'accept';
  elsif v_probability > 0.50 and v_estimated_margin_percent > 10 then
    v_recommendation := 'neutral';
  elsif v_estimated_margin_percent < 10 or v_probability < 0.40 then
    v_recommendation := 'caution';
  elsif v_estimated_margin_percent < 5 or v_probability < 0.25 then
    v_recommendation := 'reject';
  else
    v_recommendation := 'neutral';
  end if;

  v_reasoning_text :=
    format('Portfolio=%s | Prob=%.2f | Margin=%.1f%% | Impact=%.0f¢',
      v_customer_portfolio, v_probability, v_estimated_margin_percent, v_margin_impact_cents);

  v_forecast := jsonb_build_object(
    'originalMarginCents', v_original_margin_cents,
    'originalMarginPercent', v_original_margin_percent,
    'estimatedMarginCents', v_estimated_margin_cents,
    'estimatedMarginPercent', v_estimated_margin_percent,
    'marginImpactCents', v_margin_impact_cents,
    'acceptanceProbability', v_probability,
    'confidenceScore', v_confidence,
    'expectedRevenueCents', v_expected_revenue_cents,
    'expectedMarginCents', v_expected_margin_cents,
    'expectedValueScore', v_expected_value_score,
    'recommendation', v_recommendation,
    'reasoningText', v_reasoning_text
  );

  -- 3️⃣ Store / update record in counterOfferForecasts
  insert into counterOfferForecasts (
    shops,
    counterOffers,
    forecastJson,
    createdDate,
    modifiedDate
  )
  values (
    p_shops_id,
    p_counter_offer_id,
    v_forecast,
    v_now,
    v_now
  )
  on conflict (counterOffers)
  do update set
    forecastJson = excluded.forecastJson,
    modifiedDate = excluded.modifiedDate
  returning forecastJson into v_forecast;

  return v_forecast;
end;
$$;
