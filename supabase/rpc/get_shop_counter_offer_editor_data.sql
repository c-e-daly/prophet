-- =============================================================================
-- fn: get_shop_counter_offer_editor_data
-- desc: Fetches all data needed for the Counter Offer Editor.
--       If counter offer exists, loads full offer/cart/consumer context.
-- params:
--   p_shops_id          bigint  -- required
--   p_counter_offer_id  bigint default null
--   p_offers_id         bigint default null
-- returns: jsonb {
--   offers: {...},
--   carts: {...},
--   cartItems: [...],
--   consumers: {...},
--   consumerShop12M: {...} | null,
--   consumerShopCPM: {...} | null,
--   consumerShopCPMS: {...} | null,
--   consumerShopLTV: {...} | null,      -- optional if table exists
--   counterOffers: {...} | null
-- }
-- folders: /rpc/counter_offers/get_shop_counter_offer_editor_data.sql
-- =============================================================================

create or replace function get_shop_counter_offer_editor_data(
  p_shops_id          bigint,
  p_counter_offer_id  bigint default null,
  p_offers_id         bigint default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_counter_offer    record;
  v_offer            record;
  v_cart             record;
  v_cart_items       jsonb := null;
  v_cart_items_json  jsonb;
  v_consumer         record;
  v_consumer_12m     record;
  v_consumer_cpm     record;
  v_consumer_cpms    record;
  v_consumer_ltv     record;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  -- 1) If editing an existing counter offer, load it and derive offers id
  if p_counter_offer_id is not null then
    select *
      into v_counter_offer
      from "counterOffers"
     where id    = p_counter_offer_id
       and shops = p_shops_id
     limit 1;

    if not found then
      raise exception 'counter_offer_not_found';
    end if;

    p_offers_id := v_counter_offer.offers;
  end if;

  if p_offers_id is null then
    raise exception 'Either counter_offer_id or offers_id must be provided';
  end if;

  -- 2) Offer
  select *
    into v_offer
    from offers
   where id    = p_offers_id
     and shops = p_shops_id
   limit 1;

  if not found then
    raise exception 'offer_not_found';
  end if;

  -- Prefer the JSONB snapshot stored on offers."cartItems" when present.
  -- If null/empty, fall back to a live aggregation from cartitems.

if v_offer."cartItems" is not null then
  v_cart_items_json := to_jsonb(v_offer."cartItems");
  -- only accept if it is a non-empty JSON array
  if jsonb_typeof(v_cart_items_json) = 'array'
     and jsonb_array_length(v_cart_items_json) > 0 then
    v_cart_items := v_cart_items_json;
  end if;
end if;

-- fallback aggregation
if v_cart_items is null then
  select coalesce(jsonb_agg(to_jsonb(ci.*)), '[]'::jsonb)
    into v_cart_items
    from cartitems ci
   where ci.carts = v_offer.carts
     and ci.shops = p_shops_id;
end if;

  -- 3) Cart (if any)
  if v_offer.carts is not null then
    select *
      into v_cart
      from carts
     where id = v_offer.carts
     limit 1;
  end if;

  -- 4) Consumer and analytic rollups (if any)
  if v_offer.consumers is not null then
    select *
      into v_consumer
      from consumers
     where id = v_offer.consumers
     limit 1;

    -- consumerShop12M (materialized VIEW)
    select *
      into v_consumer_12m
      from "consumerShop12m"
     where consumers = v_offer.consumers
       and shops     = p_shops_id
     limit 1;

    -- consumerShopCPM (current CPM state)
    begin
      select *
        into v_consumer_cpm
        from "consumerShopCPM"
       where consumers = v_offer.consumers
         and shops     = p_shops_id
       limit 1;
    exception
      when undefined_table then
        v_consumer_cpm := null; -- table not present in this env
    end;

    -- consumerShopCPMS (scored/snapshot set)
    begin
      select *
        into v_consumer_cpms
        from "consumerShopCPMS"
       where consumers = v_offer.consumers
         and shops     = p_shops_id
         and "isActive" = true
       limit 1;
    exception
      when undefined_table then
        v_consumer_cpms := null;
    end;

    -- consumerShopLTV (longer horizon)
    begin
      select *
        into v_consumer_ltv
        from "consumerShopLTV"
       where consumers = v_offer.consumers
         and shops     = p_shops_id
       limit 1;
    exception
      when undefined_table then
        v_consumer_ltv := null;
    end;
  end if;

  -- 5) Return payload
  return jsonb_build_object(
    'offers',            to_jsonb(v_offer),
    'carts',             to_jsonb(v_cart),
    'cartItems',         coalesce(v_cart_items, '[]'::jsonb),
    'consumers',         to_jsonb(v_consumer),
    'consumerShop12M',   to_jsonb(v_consumer_12m),
    'consumerShopCPM',   to_jsonb(v_consumer_cpm),
    'consumerShopCPMS',  to_jsonb(v_consumer_cpms),
    'consumerShopLTV',   to_jsonb(v_consumer_ltv),
    'counterOffers',     to_jsonb(v_counter_offer)
  );
end;
$$;
