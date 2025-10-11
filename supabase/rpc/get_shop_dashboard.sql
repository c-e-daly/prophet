-- =============================================================================
-- fn: get_shop_dashboard
-- desc: Returns sales summaries and NOR time series for a shop:
--       - today, WTD, MTD, YTD summaries
--       - NOR by month (CY vs PY) up to current month
--       - NOR by week (last 13 weeks, Mon-start)
-- params:
--   p_shops_id bigint -- required
-- returns: jsonb {
--   today, wtd, mtd, ytd: {
--     order_count, gross_sales, nor_sales, consumers, aov
--   },
--   nor_by_month: [{ date:'YYYY-MM-01', cy: numeric, py: numeric }],
--   nor_by_week_13: [{ date:'YYYY-MM-DD', cy: numeric }]
-- }
-- folders: /rpc/dashboard/get_shop_dashboard.sql
-- =============================================================================

create or replace function get_shop_dashboard(p_shops_id bigint)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now        timestamptz := now() at time zone 'utc';
  v_day_start  timestamptz := date_trunc('day',   v_now);
  v_week_start timestamptz := date_trunc('week',  v_now);   -- Monday
  v_month_start timestamptz := date_trunc('month', v_now);
  v_ytd_start  timestamptz := date_trunc('year',  v_now);

  v_prev_year_start timestamptz := date_trunc('year', (v_now - interval '1 year'));
  v_prev_year_end   timestamptz := v_ytd_start;

  v_start_13_weeks  timestamptz := (v_week_start - interval '12 weeks');

  v_today   jsonb;
  v_wtd     jsonb;
  v_mtd     jsonb;
  v_ytd     jsonb;

  v_nor_by_month   jsonb := '[]'::jsonb;
  v_nor_by_week_13 jsonb := '[]'::jsonb;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    return jsonb_build_object(
      'today', jsonb_build_object('order_count',0,'gross_sales',0,'nor_sales',0,'consumers',0,'aov',0),
      'wtd',   jsonb_build_object('order_count',0,'gross_sales',0,'nor_sales',0,'consumers',0,'aov',0),
      'mtd',   jsonb_build_object('order_count',0,'gross_sales',0,'nor_sales',0,'consumers',0,'aov',0),
      'ytd',   jsonb_build_object('order_count',0,'gross_sales',0,'nor_sales',0,'consumers',0,'aov',0),
      'nor_by_month', '[]'::jsonb,
      'nor_by_week_13', '[]'::jsonb
    );
  end if;

  with base as (
    select
      id,
      createDate,
      consumers,
      coalesce(grossSales,0) as gross_sales,
      coalesce(grossShippingSales,0) as shipping_sales,
      coalesce(grossDiscounts,0) as discounts,
      (coalesce(grossSales,0) + coalesce(grossShippingSales,0))                        as gross_total,
      (coalesce(grossSales,0) + coalesce(grossShippingSales,0) - coalesce(grossDiscounts,0)) as nor_total
    from orders
    where shops = p_shops_id
  ),
  ytd as (
    select * from base where createDate >= v_ytd_start
  ),
  prev_year as (
    select * from base
    where createDate >= v_prev_year_start
      and createDate <  v_prev_year_end
  ),
  last_13_weeks as (
    select * from base where createDate >= v_start_13_weeks
  )
  -- Summaries
  select
    -- today
    (
      select jsonb_build_object(
        'order_count', count(*),
        'gross_sales', coalesce(sum(gross_total),0),
        'nor_sales',   coalesce(sum(nor_total),0),
        'consumers',   count(distinct consumers),
        'aov',         case when count(*)=0 then 0 else coalesce(sum(gross_total),0)::numeric / count(*) end
      ) from ytd where createDate >= v_day_start
    ),
    -- wtd
    (
      select jsonb_build_object(
        'order_count', count(*),
        'gross_sales', coalesce(sum(gross_total),0),
        'nor_sales',   coalesce(sum(nor_total),0),
        'consumers',   count(distinct consumers),
        'aov',         case when count(*)=0 then 0 else coalesce(sum(gross_total),0)::numeric / count(*) end
      ) from ytd where createDate >= v_week_start
    ),
    -- mtd
    (
      select jsonb_build_object(
        'order_count', count(*),
        'gross_sales', coalesce(sum(gross_total),0),
        'nor_sales',   coalesce(sum(nor_total),0),
        'consumers',   count(distinct consumers),
        'aov',         case when count(*)=0 then 0 else coalesce(sum(gross_total),0)::numeric / count(*) end
      ) from ytd where createDate >= v_month_start
    ),
    -- ytd
    (
      select jsonb_build_object(
        'order_count', count(*),
        'gross_sales', coalesce(sum(gross_total),0),
        'nor_sales',   coalesce(sum(nor_total),0),
        'consumers',   count(distinct consumers),
        'aov',         case when count(*)=0 then 0 else coalesce(sum(gross_total),0)::numeric / count(*) end
      ) from ytd
    )
  into v_today, v_wtd, v_mtd, v_ytd;

  -- NOR by month: series from Jan (YTD start) to current month inclusive
  with months as (
    select date_trunc('month', v_ytd_start) + (n || ' month')::interval as m_start
    from generate_series(0, extract(month from v_now)::int) g(n)
  ),
  cy as (
    select date_trunc('month', createDate) as m, sum(nor_total) as cy
    from ytd
    group by 1
  ),
  py as (
    select date_trunc('month', createDate) as m, sum(nor_total) as py
    from prev_year
    group by 1
  )
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'date', to_char(m.m_start, 'YYYY-MM-01'),
             'cy', coalesce(cy.cy,0),
             'py', coalesce(py.py,0)
           )
           order by m.m_start
         ), '[]'::jsonb)
  into v_nor_by_month
  from months m
  left join cy on cy.m = m.m_start
  left join py on py.m = (m.m_start - interval '1 year');

  -- NOR by week (last 13 weeks incl current), Monday-aligned
  with weeks as (
    select v_start_13_weeks + (i * interval '1 week') as w_start
    from generate_series(0,12) gs(i)
  ),
  wk as (
    select date_trunc('week', createDate) as w, sum(nor_total) as cy
    from last_13_weeks
    group by 1
  )
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'date', to_char(w.w_start, 'YYYY-MM-DD'),
             'cy', coalesce(k.cy,0)
           )
           order by w.w_start
         ), '[]'::jsonb)
  into v_nor_by_week_13
  from weeks w
  left join wk k on k.w = w.w_start;

  return jsonb_build_object(
    'today', v_today,
    'wtd',   v_wtd,
    'mtd',   v_mtd,
    'ytd',   v_ytd,
    'nor_by_month',   v_nor_by_month,
    'nor_by_week_13', v_nor_by_week_13
  );
end;
$$;
