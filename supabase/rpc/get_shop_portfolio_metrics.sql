-- supabase/rpc/get_cpm_portfolio_metrics.sql
-- Returns one row per portfolio with CY, PY, and YoY for key KPIs.
-- Assumptions:
--   - consumerShopCPMS contains portfolio assignment per consumer per shop
--   - consumerShopCPM contains CY & PY rollups or is filterable by date ranges
--   - Join key: (shops, consumers)
-- Adjust column names if yours differ (see comments below).

create or replace function public.get_shop_portfolio_metrics(
  p_shops_id bigint,
  p_asof_date date default current_date,
  p_period text default 'YTD'  -- 'YTD' | 'MTD' | 'QTD' | 'RANGE'
)
returns table (
  portfolio_slug text,
  portfolio_name text,
  gross_profit_cy numeric,
  gross_profit_py numeric,
  yoy_gross_profit_pct numeric,
  time_between_orders_cy numeric,
  time_between_orders_py numeric,
  yoy_tbo_pct numeric,
  aov_cy numeric,
  aov_py numeric,
  yoy_aov_pct numeric
)
language plpgsql
as $$
declare
  _cy_start date;
  _py_start date;
  _cy_end   date := p_asof_date;
  _py_end   date := (p_asof_date - interval '1 year')::date;
begin
  -- Resolve date windows for CY/PY
  if p_period = 'YTD' then
    _cy_start := date_trunc('year', p_asof_date)::date;
    _py_start := date_trunc('year', _py_end)::date;
  elsif p_period = 'MTD' then
    _cy_start := date_trunc('month', p_asof_date)::date;
    _py_start := date_trunc('month', _py_end)::date;
  elsif p_period = 'QTD' then
    _cy_start := date_trunc('quarter', p_asof_date)::date;
    _py_start := date_trunc('quarter', _py_end)::date;
  else
    -- RANGE: if you want to extend later, add explicit params
    _cy_start := date_trunc('year', p_asof_date)::date;
    _py_start := date_trunc('year', _py_end)::date;
  end if;

  return query
  with base as (
    select
      s.portfolio_slug,           -- e.g. 'new','growth','stable','reactivated','declining','defected'
      s.portfolio_name,           -- display label
      m.consumers,
      -- NOTE: If consumerShopCPM stores dated rows, compute these via FILTER by _cy/_py.
      -- Otherwise, if you already have *_cy / *_py columns, select them directly.
      -- Replace the "/* TODO: */" sections to match your schema.
      /* Gross Profit */
      coalesce(m.gross_profit_cy, (
        select coalesce(sum(x.gross_profit),0)
        from public."consumerShopCPM" x
        where x.shops = m.shops
          and x.consumers = m.consumers
          and x.meas_date >= _cy_start and x.meas_date <= _cy_end
      )) as gp_cy,
      coalesce(m.gross_profit_py, (
        select coalesce(sum(x.gross_profit),0)
        from public."consumerShopCPM" x
        where x.shops = m.shops
          and x.consumers = m.consumers
          and x.meas_date >= _py_start and x.meas_date <= _py_end
      )) as gp_py,

      /* Time Between Orders (average days) */
      coalesce(m.avg_days_between_orders_cy, (
        select coalesce(avg(x.days_between_orders),0)
        from public."consumerShopCPM" x
        where x.shops = m.shops
          and x.consumers = m.consumers
          and x.meas_date >= _cy_start and x.meas_date <= _cy_end
      )) as tbo_cy,
      coalesce(m.avg_days_between_orders_py, (
        select coalesce(avg(x.days_between_orders),0)
        from public."consumerShopCPM" x
        where x.shops = m.shops
          and x.consumers = m.consumers
          and x.meas_date >= _py_start and x.meas_date <= _py_end
      )) as tbo_py,

      /* AOV */
      coalesce(m.aov_cy, (
        select case when coalesce(sum(x.orders),0) = 0 then 0
                    else coalesce(sum(x.nor_sales),0) / nullif(sum(x.orders),0) end
        from public."consumerShopCPM" x
        where x.shops = m.shops
          and x.consumers = m.consumers
          and x.meas_date >= _cy_start and x.meas_date <= _cy_end
      )) as aov_cy,

      coalesce(m.aov_py, (
        select case when coalesce(sum(x.orders),0) = 0 then 0
                    else coalesce(sum(x.nor_sales),0) / nullif(sum(x.orders),0) end
        from public."consumerShopCPM" x
        where x.shops = m.shops
          and x.consumers = m.consumers
          and x.meas_date >= _py_start and x.meas_date <= _py_end
      )) as aov_py

    from public."consumerShopCPMS" s
    join public."consumerShopCPM" m
      on m.shops = s.shops and m.consumers = s.consumers
    where s.shops = p_shops_id
  )
  select
    portfolio_slug,
    portfolio_name,
    sum(gp_cy) as gross_profit_cy,
    sum(gp_py) as gross_profit_py,
    case when sum(gp_py) = 0 then null
         else (sum(gp_cy) - sum(gp_py)) / nullif(sum(gp_py),0) * 100 end as yoy_gross_profit_pct,

    avg(tbo_cy) as time_between_orders_cy,
    avg(tbo_py) as time_between_orders_py,
    case when avg(tbo_py) = 0 then null
         else (avg(tbo_cy) - avg(tbo_py)) / nullif(avg(tbo_py),0) * 100 end as yoy_tbo_pct,

    case when sum(aov_cy) is null then 0 else avg(aov_cy) end as aov_cy,
    case when sum(aov_py) is null then 0 else avg(aov_py) end as aov_py,
    case when avg(aov_py) = 0 then null
         else (avg(aov_cy) - avg(aov_py)) / nullif(avg(aov_py),0) * 100 end as yoy_aov_pct
  from base
  group by portfolio_slug, portfolio_name
  order by portfolio_slug;
end;
$$;
