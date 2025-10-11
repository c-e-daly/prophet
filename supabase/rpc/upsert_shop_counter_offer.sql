-- =============================================================================
-- fn: upsert_shop_counter_offer
-- desc: Create or update a counter offer for a given shop + offer.
--       Mirrors the createCounterOffer Remix helper logic.
-- params:
--   p_shops_id          bigint      -- required
--   p_offers_id         bigint      -- required
--   p_counter_templates_id bigint   -- optional (link to template)
--   p_counter_type      text        -- required
--   p_counter_config    jsonb       -- required
--   p_total_discount_cents numeric  -- required
--   p_counter_offer_price numeric   -- required
--   p_estimated_margin_percent numeric -- required
--   p_estimated_margin_cents numeric   -- required
--   p_original_margin_percent numeric  -- required
--   p_original_margin_cents numeric    -- required
--   p_margin_impact_cents numeric      -- required
--   p_predicted_acceptance_probability numeric -- required
--   p_confidence_score numeric         -- required
--   p_prediction_factors jsonb         -- required
--   p_expected_revenue_cents numeric   -- required
--   p_expected_margin_cents numeric    -- required
--   p_expected_value_score numeric     -- required
--   p_headline          text           -- required
--   p_description       text           -- required
--   p_reason            text default null
--   p_internal_notes    text default null
--   p_strategy_rationale text default null
--   p_requires_approval boolean default false
--   p_created_by_user   bigint          -- required
--   p_expires_at        timestamptz default null
-- returns: counterOffers
-- folders: /rpc/counter_offers/upsert_shop_counter_offer.sql
-- =============================================================================

create or replace function upsert_shop_counter_offer(
  p_shops_id          bigint,
  p_offers_id         bigint,
  p_created_by_user   bigint,
  p_counter_type      text,
  p_counter_config    jsonb,
  p_total_discount_cents numeric,
  p_counter_offer_price numeric,
  p_estimated_margin_percent numeric,
  p_estimated_margin_cents numeric,
  p_original_margin_percent numeric,
  p_original_margin_cents numeric,
  p_margin_impact_cents numeric,
  p_predicted_acceptance_probability numeric,
  p_confidence_score numeric,
  p_prediction_factors jsonb,
  p_expected_revenue_cents numeric,
  p_expected_margin_cents numeric,
  p_expected_value_score numeric,
  p_headline          text,
  p_description       text,
  p_reason            text default null,
  p_internal_notes    text default null,
  p_strategy_rationale text default null,
  p_requires_approval boolean default false,
  p_counter_templates_id bigint default null,
  p_expires_at        timestamptz default null
)

returns setof "counterOffers"
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_inserted "counterOffers"%rowtype;
  v_usage int;
begin
  if p_shops_id is null then
    raise exception 'p_shops_id is required';
  end if;
  if p_offers_id is null then
    raise exception 'p_offers_id is required';
  end if;
  if coalesce(trim(p_counter_type),'') = '' then
    raise exception 'p_counter_type is required';
  end if;

  -- 1️⃣ Insert new counter offer
  insert into "counterOffers" (
    "shops",
    "offers",
    "counterTemplates",
    "counterType",
    "counterConfig",
    "totalDiscountCents",
   -- "acceptedAmountCents",
    "counterOfferPrice",
    "estimatedMarginPercent",
    "estimatedMarginCents",
    "originalMarginPercent",
    "originalMarginCents",
    "marginImpactCents",
    "predictedAcceptanceProbability",
    "confidenceScore",
    "predictionFactors",
    "expectedRevenueCents",
    "expectedMarginCents",
    "expectedValueScore",
    "headline",
    "description",
    "reason",
    "internalNotes",
    "strategyRationale",
    "offerStatus",
    "requiresApproval",
    "createdByUser",
    "expiresAt",
    "createDate",
    "modifiedDate"
  )
  values (
    p_shops_id,
    p_offers_id,
    p_counter_templates_id,
    p_counter_type,
    p_counter_config,
    p_total_discount_cents,
    null, -- acceptedAmountCents
    p_counter_offer_price,
    p_estimated_margin_percent,
    p_estimated_margin_cents,
    p_original_margin_percent,
    p_original_margin_cents,
    p_margin_impact_cents,
    p_predicted_acceptance_probability,
    p_confidence_score,
    p_prediction_factors,
    p_expected_revenue_cents,
    p_expected_margin_cents,
    p_expected_value_score,
    p_headline,
    p_description,
    p_reason,
    p_internal_notes,
    p_strategy_rationale,
    'draft',  -- initial offerStatus
    p_requires_approval,
    p_created_by_user,
    p_expires_at,
    v_now,
    v_now
  )
  returning * into v_inserted;

  -- 2️⃣ If linked to a template, increment its usage counter
  if p_counter_templates_id is not null then
    select usage into v_usage
    from "counterTemplates"
    where id = p_counter_templates_id;

    update "counterTemplates"
    set
      usage = coalesce(v_usage,0) + 1,
      modifiedDate = v_now
    where id = p_counter_templates_id;
  end if;

  return query select v_inserted.*;
end;
$$;
