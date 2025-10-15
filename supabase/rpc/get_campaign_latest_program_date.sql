-- =============================================================================
-- fn: get_campaign_latest_program_date
-- desc: Gets the latest program end date for a campaign (excluding specified program)
-- =============================================================================

create or replace function get_campaign_latest_program_date(
  p_shops_id bigint,
  p_campaigns_id bigint,
  p_exclude_program_id bigint default null
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
  
  if p_campaigns_id is null or p_campaigns_id <= 0 then
    raise exception 'Invalid or missing campaign id.';
  end if;

  select max("endDate")
  into v_latest_end_date
  from programs
  where shops = p_shops_id
    and campaigns = p_campaigns_id
    and (p_exclude_program_id is null or id != p_exclude_program_id)
    and "endDate" is not null;

  return v_latest_end_date;
end;
$$;