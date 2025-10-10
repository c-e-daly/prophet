-- Function: public.upsert_shopify_order_details
-- Version: 1.4
-- Updated: 2025-10-10
-- Notes:
--   Added first deployment
--   Harmonized with upsert_shopify_order_details



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

  with src as (
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
    from public."shopifyOrders" o,
         lateral jsonb_array_elements(o.line_items) li
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
  -- Dedupe variants per tenant + productVariantID (NOTE: variants."shops" is the tenant FK)
  v_one as (
    select distinct on (v."shops", v."productVariantID")
           v.id, v."shops", v."productVariantID"
    from public."variants" v
    order by v."shops", v."productVariantID", v.id desc
  ),
  joined_cogs as (
    select
      w.*,
      vp.cogs as cogs_unit
    from with_money w
    left join v_one v
      on v."productVariantID" = w.variant_id::text
     and v."shops" = w."shopsID"           -- <<< changed to "shops"
    left join public."variantPricing" vp
      on vp.variants = v.id
     and vp.shops   = w."shopsID"
     and coalesce(vp.published, true) = true
  ),
  final_rows as (
    select
      j."shopsID",
      j.order_id,
      j.line_item_id,
      j.product_id,
      j.variant_id,
      j.sku,
      j.title,
      j.variant_title,
      j.vendor,
      j.quantity,
      j.grams,
      j.price,
      j.pre_tax_price,
      j.total_discount,
      j.discount_allocations,
      j.tax_lines,
      j.duties,
      j.gross_line_revenue,
      j.tax_amount,
      j.duty_amount,
      j.discount_amount,
      j.net_line_revenue,
      j.cogs_unit,
      (coalesce(j.cogs_unit,0) * coalesce(j.quantity,0))::numeric(19,4) as cogs_total,
      (coalesce(j.net_line_revenue,0) - (coalesce(j.cogs_unit,0) * coalesce(j.quantity,0)))::numeric(19,4) as margin_amount,
      case
        when coalesce(j.net_line_revenue,0) = 0 then null
        else ((coalesce(j.net_line_revenue,0) - (coalesce(j.cogs_unit,0) * coalesce(j.quantity,0))) / j.net_line_revenue)::numeric(9,4)
      end as margin_pct,
      j.raw_line_item
    from joined_cogs j
  )
  insert into public."shopifyOrderDetails" as od (
    "shopsID", order_id, line_item_id,
    product_id, variant_id, sku, title, variant_title, vendor,
    quantity, grams,
    price, pre_tax_price, total_discount,
    discount_allocations, tax_lines, duties,
    gross_line_revenue, tax_amount, duty_amount, discount_amount, net_line_revenue,
    cogs_unit, cogs_total, margin_amount, margin_pct,
    raw_line_item
  )
  select * from final_rows
  on conflict ("shopsID", order_id, line_item_id) do update set
    product_id           = excluded.product_id,
    variant_id           = excluded.variant_id,
    sku                  = excluded.sku,
    title                = excluded.title,
    variant_title        = excluded.variant_title,
    vendor               = excluded.vendor,
    quantity             = excluded.quantity,
    grams                = excluded.grams,
    price                = excluded.price,
    pre_tax_price        = excluded.pre_tax_price,
    total_discount       = excluded.total_discount,
    discount_allocations = excluded.discount_allocations,
    tax_lines            = excluded.tax_lines,
    duties               = excluded.duties,
    gross_line_revenue   = excluded.gross_line_revenue,
    tax_amount           = excluded.tax_amount,
    duty_amount          = excluded.duty_amount,
    discount_amount      = excluded.discount_amount,
    net_line_revenue     = excluded.net_line_revenue,
    cogs_unit            = excluded.cogs_unit,
    cogs_total           = excluded.cogs_total,
    margin_amount        = excluded.margin_amount,
    margin_pct           = excluded.margin_pct,
    raw_line_item        = excluded.raw_line_item;

  GET DIAGNOSTICS _affected = ROW_COUNT;
  return _affected;
end $$;

grant execute on function public.upsert_shopify_order_details(bigint) to authenticated, anon;
