-- =============================================================================
-- fn: get_shop_latest_campaign_date
-- desc: Gets the latest end date from campaigns (excluding specified campaign)
-- =============================================================================

create or replace function get_shop_latest_campaign_date(
  p_shops_id bigint,
  p_exclude_campaign_id bigint default null
)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_latest_end_date timestamptz;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  select max("endDate")
  into v_latest_end_date
  from campaigns
  where shops = p_shops_id
    and (p_exclude_campaign_id is null or id != p_exclude_campaign_id)
    and "endDate" is not null;

  return v_latest_end_date;
end;
$$;