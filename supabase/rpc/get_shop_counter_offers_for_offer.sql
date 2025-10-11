-- =============================================================================
-- fn: get_shop_counter_offers_for_offer
-- desc: Returns all counter offers for a given offer belonging to a shop.
--       Mirrors getCounterOffersForOffer.ts logic from Remix.
-- params:
--   p_shops_id  bigint  -- required
--   p_offers_id bigint  -- required
-- returns: setof "counterOffers"
-- folders: /rpc/counter_offers/get_shop_counter_offers_for_offer.sql
-- =============================================================================

create or replace function get_shop_counter_offers_for_offer(
  p_shops_id  bigint,
  p_offers_id bigint
)
returns setof "counterOffers"
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  if p_offers_id is null or p_offers_id <= 0 then
    raise exception 'Invalid or missing offer id.';
  end if;

  return query
  select *
  from "counterOffers"
  where "shops" = p_shops_id
    and "offers" = p_offers_id
  order by "createDate" desc;
end;
$$;
