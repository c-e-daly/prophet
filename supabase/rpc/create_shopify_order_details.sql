-- Function: public.create_shopify_order_details
-- Version: 1.4
-- Updated: 2025-10-10
-- Notes:
--   Added cancel_reason + cancelled_at
--   Harmonized with upsert_shopify_order_details
-- Drop if resetting
-- drop table if exists public."shopifyOrderDetails" cascade;

create or replace function public.upsert_shopify_order_details(_order_id bigint)
returns int
language plpgsql
as $$
declare
  _shops_id int;
  _affected int := 0;
begin
  -- tenant for this order
  select "shopsID" into _shops_id
  from public."shopifyOrders"
  where id = _order_id;

  if _shops_id is null then
    raise exception 'Order % not found in shopifyOrders', _order_id;
  end if;

  -- Pull order-level shipping and fulfillment totals from shopifyOrders
  with ship_src as (
    select
      o.id as order_id,
      o.shipping_lines as raw_shipping_lines,
      coalesce((
        select sum(public.safe_num(sl->>'price'))
        from jsonb_array_elements(coalesce(o.shipping_lines,'[]'::jsonb)) sl
      ), 0)::numeric(19,4) as ship_rev_total,
      coalesce((
        select sum(
                 greatest(
                   public.safe_num(sl->>'price')
                 - coalesce(public.safe_num(sl->>'discounted_price'),
                            public.safe_num(sl->>'price')), 0
                 )
               )
        from jsonb_array_elements(coalesce(o.shipping_lines,'[]'::jsonb)) sl
      ), 0)::numeric(19,4) as ship_disc_total,
      coalesce((
        select sum(public.safe_num(tl->>'price'))
        from jsonb_array_elements(coalesce(o.shipping_lines,'[]'::jsonb)) sl
        left join lateral jsonb_array_elements(coalesce(sl->'tax_lines','[]'::jsonb)) tl on true
      ), 0)::numeric(19,4) as ship_tax_total
    from public."shopifyOrders" o
    where o.id = _order_id
  ),
  cogs_src as (
    select
      o.id as order_id,
      o.fulfillments as raw_fulfillments,
      coalesce((
        select sum(public.safe_num(ff->>'shipping_cost'))
        from jsonb_array_elements(coalesce(o.fulfillments,'[]'::jsonb)) ff
      ), 0)::numeric(19,4) as ship_cogs_total
    from public."shopifyOrders" o
    where o.id = _order_id
  ),
  src as (
    select
      _shops_id                               as "shopsID",
      o.id                                    as order_id,
      (li->>'id')::bigint                     as line_item_id,
      nullif(li->>'product_id','')::bigint    as product_id,
      nullif(li->>'variant_id','')::bigint    as variant_id,
      li->>'sku'                              as sku,
      li->>'title'                            as title,
      li->>'variant_title'                    as variant_title,
      li->>'vendor'                           as vendor,
      nullif(li->>'quantity','')::int         as quantity,
      nullif(li->>'grams','')::int            as grams,
      public.safe_num(li->>'price')           as price,
      public.safe_num(li->>'pre_tax_price')   as pre_tax_price,
      public.safe_num(li->>'total_discount')  as total_discount,
      case when jsonb_typeof(li->'discount_allocations') = 'array' then li->'discount_allocations' end as discount_allocations,
      case when jsonb_typeof(li->'tax_lines') = 'array' then li->'tax_lines' end as tax_lines,
      case when jsonb_typeof(li->'duties') = 'array' then li->'duties' end as duties,
      coalesce(
        (select sum(public.safe_num(da->>'amount')) from jsonb_array_elements(coalesce(li->'discount_allocations','[]'::jsonb)) da),
        public.safe_num(li->>'total_discount'),
        0
      ) as discount_amount,
      coalesce(
        (select sum(public.safe_num(tl->>'price')) from jsonb_array_elements(coalesce(li->'tax_lines','[]'::jsonb)) tl),
        0
      ) as tax_amount,
      coalesce(
        (select sum(public.safe_num(dy->>'price')) from jsonb_array_elements(coalesce(li->'duties','[]'::jsonb)) dy),
        0
      ) as duty_amount,
      li as raw_line_item
    from public."shopifyOrders" o
    join ship_src s on s.order_id = o.id
    join cogs_src c on c.order_id = o.id
    , lateral jsonb_array_elements(o.line_items) li
    where o.id = _order_id
  ),
  with_money as (
    select
      s.*,
      (coalesce(s.quantity,0) * coalesce(s.price,0))::numeric(19,4) as gross_line_revenue,
      (
        coalesce((s.quantity * s.price),0)
        - coalesce(s.discount_amount,0)
        + coalesce(s.tax_amount,0)
        + coalesce(s.duty_amount,0)
      )::numeric(19,4) as net_line_revenue
    from src s
  ),
  -- Order-level shipping & COGS (cross join to replicate on each line)
  order_ship as (
    select
      ss.order_id,
      ss.raw_shipping_lines,
      ss.ship_rev_total,
      ss.ship_disc_total,
      ss.ship_tax_total,
      cs.raw_fulfillments,
      cs.ship_cogs_total
    from ship_src ss
    join cogs_src cs on cs.order_id = ss.order_id
  ),
  -- Join in shipping/fulfillment totals
  money_plus_order as (
    select
      w.*,
      os.raw_shipping_lines,
      os.ship_rev_total,
      os.ship_disc_total,
      os.ship_tax_total,
      os.raw_fulfillments,
      os.ship_cogs_total
    from with_money w
    cross join order_ship os
  ),
  -- Allocation base = extended net before shipping (per line)
  base as (
    select
      m.*,
      case
        when m.net_line_revenue is null then 0
        else m.net_line_revenue
      end as alloc_base_component
    from money_plus_order m
  ),
  base_sums as (
    select
      order_id,
      coalesce(sum(alloc_base_component),0)::numeric(19,4) as alloc_base_sum,
      count(*)::int as line_count
    from base
    group by order_id
  ),
  joined_cogs as (
    -- Attach variant COGS (published) just like your original join, unchanged
    select
      b.*,
      bs.alloc_base_sum,
      bs.line_count,
      v.id as variant_row_id,
      vp.cogs as cogs_unit
    from base b
    left join (
      select distinct on (v."shops", v."productVariantID")
             v.id, v."shops", v."productVariantID"
      from public."variants" v
      order by v."shops", v."productVariantID", v.id desc
    ) v
      on v."productVariantID" = b.variant_id::text
     and v."shops" = b."shopsID"
    left join public."variantPricing" vp
      on vp.variants = v.id
     and vp.shops   = b."shopsID"
     and coalesce(vp.published, true) = true
    join base_sums bs
      on bs.order_id = b.order_id
  ),
  alloc as (
    select
      j.*,
      -- allocation weight:
      case
        when j.alloc_base_sum > 0 then (j.alloc_base_component / j.alloc_base_sum)
        else 1.0 / nullif(j.line_count,0)
      end as alloc_wt,

      -- per-line shipping allocations
      (case when j.ship_rev_total  > 0 then j.ship_rev_total  * case when j.alloc_base_sum > 0 then (j.alloc_base_component / j.alloc_base_sum) else 1.0 / nullif(j.line_count,0) end else 0 end)::numeric(19,4) as shipping_revenue_alloc,
      (case when j.ship_disc_total > 0 then j.ship_disc_total * case when j.alloc_base_sum > 0 then (j.alloc_base_component / j.alloc_base_sum) else 1.0 / nullif(j.line_count,0) end else 0 end)::numeric(19,4) as shipping_discount_alloc,
      (case when j.ship_tax_total  > 0 then j.ship_tax_total  * case when j.alloc_base_sum > 0 then (j.alloc_base_component / j.alloc_base_sum) else 1.0 / nullif(j.line_count,0) end else 0 end)::numeric(19,4) as shipping_tax_alloc,
      (case when j.ship_cogs_total > 0 then j.ship_cogs_total * case when j.alloc_base_sum > 0 then (j.alloc_base_component / j.alloc_base_sum) else 1.0 / nullif(j.line_count,0) end else 0 end)::numeric(19,4) as shipping_cogs_alloc
    from joined_cogs j
  ),
  final_rows as (
    select
      a."shopsID",
      a.order_id,
      a.line_item_id,
      a.product_id,
      a.variant_id,
      a.sku,
      a.title,
      a.variant_title,
      a.vendor,
      a.quantity,
      a.grams,
      a.price,
      a.pre_tax_price,
      a.total_discount,
      a.discount_allocations,
      a.tax_lines,
      a.duties,
      a.gross_line_revenue,
      a.tax_amount,
      a.duty_amount,
      a.discount_amount,
      a.net_line_revenue,
      a.cogs_unit,
      (coalesce(a.cogs_unit,0) * coalesce(a.quantity,0))::numeric(19,4) as cogs_total,
      (coalesce(a.net_line_revenue,0) - (coalesce(a.cogs_unit,0) * coalesce(a.quantity,0)))::numeric(19,4) as margin_amount,
      case
        when coalesce(a.net_line_revenue,0) = 0 then null
        else ((coalesce(a.net_line_revenue,0) - (coalesce(a.cogs_unit,0) * coalesce(a.quantity,0))) / a.net_line_revenue)::numeric(9,4)
      end as margin_pct,

      -- NEW: shipping allocations + recomputed with shipping
      a.raw_shipping_lines     as raw_shipping_lines,
      a.raw_fulfillments       as raw_fulfillments,
      a.shipping_revenue_alloc,
      a.shipping_discount_alloc,
      a.shipping_tax_alloc,
      a.shipping_cogs_alloc,
      (
        coalesce(a.net_line_revenue,0)
        + coalesce(a.shipping_revenue_alloc,0)
        - coalesce(a.shipping_discount_alloc,0)
        + coalesce(a.shipping_tax_alloc,0)
      )::numeric(19,4) as net_line_with_shipping,
      (
        (
          coalesce(a.net_line_revenue,0)
          + coalesce(a.shipping_revenue_alloc,0)
          - coalesce(a.shipping_discount_alloc,0)
          + coalesce(a.shipping_tax_alloc,0)
        )
        - (
          coalesce(a.cogs_unit,0) * coalesce(a.quantity,0)
          + coalesce(a.shipping_cogs_alloc,0)
        )
      )::numeric(19,4) as margin_amount_with_ship,
      case
        when (
          coalesce(a.net_line_revenue,0)
          + coalesce(a.shipping_revenue_alloc,0)
          - coalesce(a.shipping_discount_alloc,0)
          + coalesce(a.shipping_tax_alloc,0)
        ) = 0
        then null
        else (
          (
            (
              coalesce(a.net_line_revenue,0)
              + coalesce(a.shipping_revenue_alloc,0)
              - coalesce(a.shipping_discount_alloc,0)
              + coalesce(a.shipping_tax_alloc,0)
            )
            - (
              coalesce(a.cogs_unit,0) * coalesce(a.quantity,0)
              + coalesce(a.shipping_cogs_alloc,0)
            )
          ) / (
            coalesce(a.net_line_revenue,0)
            + coalesce(a.shipping_revenue_alloc,0)
            - coalesce(a.shipping_discount_alloc,0)
            + coalesce(a.shipping_tax_alloc,0)
          )
        )::numeric(9,4)
      end as margin_pct_with_ship,

      a.raw_line_item
    from alloc a
  )
  insert into public."shopifyOrderDetails" as od (
    "shopsID", order_id, line_item_id,
    product_id, variant_id, sku, title, variant_title, vendor,
    quantity, grams,
    price, pre_tax_price, total_discount,
    discount_allocations, tax_lines, duties,
    gross_line_revenue, tax_amount, duty_amount, discount_amount, net_line_revenue,
    cogs_unit, cogs_total, margin_amount, margin_pct,
    raw_shipping_lines, raw_fulfillments,
    shipping_revenue_alloc, shipping_discount_alloc, shipping_tax_alloc, shipping_cogs_alloc,
    net_line_with_shipping, margin_amount_with_ship, margin_pct_with_ship,
    raw_line_item
  )
  select * from final_rows
  on conflict ("shopsID", order_id, line_item_id) do update set
    product_id              = excluded.product_id,
    variant_id              = excluded.variant_id,
    sku                     = excluded.sku,
    title                   = excluded.title,
    variant_title           = excluded.variant_title,
    vendor                  = excluded.vendor,
    quantity                = excluded.quantity,
    grams                   = excluded.grams,
    price                   = excluded.price,
    pre_tax_price           = excluded.pre_tax_price,
    total_discount          = excluded.total_discount,
    discount_allocations    = excluded.discount_allocations,
    tax_lines               = excluded.tax_lines,
    duties                  = excluded.duties,
    gross_line_revenue      = excluded.gross_line_revenue,
    tax_amount              = excluded.tax_amount,
    duty_amount             = excluded.duty_amount,
    discount_amount         = excluded.discount_amount,
    net_line_revenue        = excluded.net_line_revenue,
    cogs_unit               = excluded.cogs_unit,
    cogs_total              = excluded.cogs_total,
    margin_amount           = excluded.margin_amount,
    margin_pct              = excluded.margin_pct,

    raw_shipping_lines      = excluded.raw_shipping_lines,
    raw_fulfillments        = excluded.raw_fulfillments,
    shipping_revenue_alloc  = excluded.shipping_revenue_alloc,
    shipping_discount_alloc = excluded.shipping_discount_alloc,
    shipping_tax_alloc      = excluded.shipping_tax_alloc,
    shipping_cogs_alloc     = excluded.shipping_cogs_alloc,

    net_line_with_shipping  = excluded.net_line_with_shipping,
    margin_amount_with_ship = excluded.margin_amount_with_ship,
    margin_pct_with_ship    = excluded.margin_pct_with_ship,

    raw_line_item           = excluded.raw_line_item;

  GET DIAGNOSTICS _affected = ROW_COUNT;
  return _affected;
end $$;

grant execute on function public.upsert_shopify_order_details(bigint) to authenticated, anon;

