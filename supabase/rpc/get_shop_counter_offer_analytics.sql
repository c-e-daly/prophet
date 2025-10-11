-- =============================================================================
-- fn: get_shop_counter_offer_analytics
-- desc: Aggregates counter-offer analytics for a given shop over a date range.
--       Combines results from the 3 analytics functions:
--         1) analyze_counter_performance_by_type
--         2) analyze_counter_performance_by_portfolio
--         3) analyze_counter_performance_by_user
-- params:
--   p_shop_id     bigint        -- required
--   p_start_date  timestamptz   -- required
--   p_end_date    timestamptz   -- required
-- returns: jsonb {
--   byType: [...],
--   byPortfolio: [...],
--   byUser: [...]
-- }
-- folders: /rpc/counter_offers/get_shop_counter_offer_analytics.sql
-- =============================================================================

create or replace function get_shop_counter_offer_analytics(
  p_shop_id    bigint,
  p_start_date timestamptz,
  p_end_date   timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_by_type      jsonb := '[]'::jsonb;
  v_by_portfolio jsonb := '[]'::jsonb;
  v_by_user      jsonb := '[]'::jsonb;
begin
  if p_shop_id is null or p_shop_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;
  if p_start_date is null or p_end_date is null then
    raise exception 'Start and end dates are required.';
  end if;

  -- 1️⃣ Performance by counter type
  begin
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_by_type
    from analyze_counter_performance_by_type(p_shop_id, p_start_date, p_end_date) as t;
  exception
    when others then
      raise notice 'Error in analyze_counter_performance_by_type: %', sqlerrm;
  end;

  -- 2️⃣ Performance by portfolio
  begin
    select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    into v_by_portfolio
    from analyze_counter_performance_by_portfolio(p_shop_id, p_start_date, p_end_date) as p;
  exception
    when others then
      raise notice 'Error in analyze_counter_performance_by_portfolio: %', sqlerrm;
  end;

  -- 3️⃣ Performance by user
  begin
    select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
    into v_by_user
    from analyze_counter_performance_by_user(p_shop_id, p_start_date, p_end_date) as u;
  exception
    when others then
      raise notice 'Error in analyze_counter_performance_by_user: %', sqlerrm;
  end;

  -- 4️⃣ Combine results into unified JSON
  return jsonb_build_object(
    'byType', v_by_type,
    'byPortfolio', v_by_portfolio,
    'byUser', v_by_user
  );
end;
$$;
