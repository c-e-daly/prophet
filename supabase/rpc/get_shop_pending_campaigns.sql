-- =============================================================================
-- fn: get_shop_pending_campaigns
-- desc: Fetches pending/draft campaigns for a shop ordered by start date
-- =============================================================================

create or replace function get_shop_pending_campaigns(
  p_shops_id bigint
)
returns setof campaigns
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  return query
  select *
  from campaigns
  where shops = p_shops_id
    and status in ('Draft', 'Pending')
  order by "startDate" asc nulls last
  limit 10;
end;
$$;