-- =============================================================================
-- fn: upsert_shop_saved_variant_prices
-- desc: Insert variantPricing, link to variants.pricing, and optionally mark
--       published & update variants.shopifyPrice.
-- params:
--   p_shops_id          bigint                  -- required
--   p_payload           jsonb  default '{}'::jsonb  -- required fields inside payload
--                     -- payload keys (all cents as numeric/int):
--                     --   variant_id (bigint), product_id (text), variant_shopify_id (text),
--                     --   variant_gid (text), item_cost, profit_markup, allowance_discounts,
--                     --   allowance_shrink, allowance_finance, allowance_shipping,
--                     --   market_adjustment, builder_price, notes (text),
--                     --   user_id (bigint), user_email (text),
--                     --   source (text, 'draft'|'published'), publish (boolean)
-- returns: jsonb { pricing_id: bigint, published: boolean }
-- folders: /rpc/variant_pricing/upsert_shop_saved_variant_prices.sql
-- =============================================================================

create or replace function upsert_shop_saved_variant_prices(
  p_shops_id bigint,
  p_payload  jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now               timestamptz := now();
  v_variant_id        bigint;
  v_product_id        text;
  v_variant_shopify_id text;
  v_variant_gid       text;
  v_item_cost         numeric;
  v_profit_markup     numeric;
  v_allow_disc        numeric;
  v_allow_shrink      numeric;
  v_allow_fin         numeric;
  v_allow_ship        numeric;
  v_market_adjust     numeric;
  v_builder_price     numeric;
  v_notes             text;
  v_user_id           bigint;
  v_user_email        text;
  v_source            text := coalesce(p_payload->>'source', 'draft');
  v_publish           boolean := coalesce((p_payload->>'publish')::boolean, false);
  v_pricing_id        bigint;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  -- Extract required
  v_variant_id     := (p_payload->>'variant_id')::bigint;
  v_product_id     := p_payload->>'product_id';
  v_variant_shopify_id := p_payload->>'variant_shopify_id';
  v_variant_gid    := p_payload->>'variant_gid';
  v_item_cost      := (p_payload->>'item_cost')::numeric;
  v_profit_markup  := (p_payload->>'profit_markup')::numeric;
  v_allow_disc     := (p_payload->>'allowance_discounts')::numeric;
  v_allow_shrink   := (p_payload->>'allowance_shrink')::numeric;
  v_allow_fin      := (p_payload->>'allowance_finance')::numeric;
  v_allow_ship     := (p_payload->>'allowance_shipping')::numeric;
  v_market_adjust  := (p_payload->>'market_adjustment')::numeric;
  v_builder_price  := (p_payload->>'builder_price')::numeric;
  v_notes          := p_payload->>'notes';
  v_user_id        := (p_payload->>'user_id')::bigint;
  v_user_email     := p_payload->>'user_email';

  if v_variant_id is null then
    raise exception 'payload.variant_id is required';
  end if;

  -- 1) insert variantPricing
  insert into "variantPricing" (
    shops, variants, productID, variantID, itemCost, profitMarkup,
    allowanceDiscounts, allowanceShrink, allowanceFinance, allowanceShipping,
    marketAdjustment, builderPrice, currency, source, notes,
    createdByUser, createDate, modifiedDate, updatedBy, "isPublished"
  ) values (
    p_shops_id, v_variant_id, v_product_id, v_variant_shopify_id, v_item_cost, v_profit_markup,
    v_allow_disc, v_allow_shrink, v_allow_fin, v_allow_ship,
    v_market_adjust, v_builder_price, 'USD', v_source, v_notes,
    v_user_id, v_now, v_now, v_user_email, false
  )
  returning id into v_pricing_id;

  -- 2) link variant.pricing
  update variants
  set pricing = v_pricing_id,
      modifiedDate = v_now
  where id = v_variant_id
    and shops = p_shops_id;

  -- 3) optional publish mark (DB only)
  if v_publish is true then
    update "variantPricing"
    set "isPublished" = true,
        "publishedDate" = v_now,
        "publishedPrice" = v_builder_price,
        "modifiedDate" = v_now,
        "createdByUser" = v_user_id
    where id = v_pricing_id
      and shops = p_shops_id;

    update variants
    set shopifyPrice = v_builder_price,
        modifiedDate = v_now
    where id = v_variant_id
      and shops = p_shops_id;
  end if;

  return jsonb_build_object(
    'pricing_id', v_pricing_id,
    'published', v_publish
  );
end;
$$;
