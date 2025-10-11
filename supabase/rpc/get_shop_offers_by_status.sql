-- =============================================================================
-- fn: get_shop_offers_by_status
-- desc: Paginated list of offers for a shop over the last N months,
--       filtered by one or more offerStatus values.
-- params:
--   p_shops_id     bigint         -- required
--   p_statuses     "offerStatus"[]  -- nullable; when null, returns all statuses
--   p_months_back  int            -- default 12
--   p_limit        int            -- default 50
--   p_page         int            -- default 1 (1-based)
-- returns: (rows jsonb, total_count bigint)
-- folders: /rpc/offers/get_shop_offers_by_status.sql
-- =============================================================================
create or replace function get_shop_offers_by_status(
  p_shops_id     bigint,
  p_statuses     "offerStatus"[] default null,
  p_months_back  int default 12,
  p_limit        int default 50,
  p_page         int default 1
)
returns table (
  rows         jsonb,
  total_count  bigint
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cutoff    timestamptz;
  v_offset    int;
begin
  if p_shops_id is null then
    raise exception 'p_shops_id is required';
  end if;

  v_cutoff := (now() at time zone 'utc') - make_interval(months => greatest(p_months_back, 0));
  v_offset := greatest(p_page - 1, 0) * greatest(p_limit, 1);

  return query
  with base as (
    select *
    from offers
    where shops = p_shops_id
      and "createDate" >= v_cutoff
      and (p_statuses is null or "offerStatus" = any(p_statuses))
  ),
  counted as (
    select count(*)::bigint as cnt from base
  ),
  page as (
    select *
    from base
    order by "createDate" desc
    offset v_offset
    limit greatest(p_limit, 1)
  )
  select
    coalesce(jsonb_agg(to_jsonb(page.*)) filter (where page.id is not null), '[]'::jsonb) as rows,
    counted.cnt as total_count
  from page
  cross join counted;
end;
$$;
