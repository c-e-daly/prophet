-- =============================================================================
-- fn: get_shop_product_variants
-- desc: Returns product variants for a shop, with nested variantPricing data.
--       Mirrors getShopProductVariants.ts logic from Remix.
-- params:
--   p_shops_id          bigint  -- required
--   p_months_back       int default 12
--   p_limit             int default 100
--   p_page              int default 1
--   p_before_created_at timestamptz default null
--   p_before_id         bigint default null
-- returns: jsonb { variants: [...], count: int }
-- folders: /rpc/variants/get_shop_product_variants.sql
-- =============================================================================

create or replace function get_shop_product_variants(
  p_shops_id          bigint,
  p_months_back       int default 12,
  p_limit             int default 100,
  p_page              int default 1,
  p_before_created_at timestamptz default null,
  p_before_id         bigint default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_since timestamptz := (now() at time zone 'utc') - make_interval(months => greatest(p_months_back, 0));
  v_from int := greatest((p_page - 1) * p_limit, 0);
  v_to   int := v_from + p_limit - 1;
  v_total bigint;
  v_rows jsonb;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  -- 1️⃣ Fetch filtered and paginated variants
  with filtered as (
    select v.*
    from variants v
    where v.shops = p_shops_id
      and v.createDate >= v_since
      and (p_before_created_at is null or v.createDate < p_before_created_at)
      and (p_before_id is null or v.id < p_before_id)
  ),
  counted as (
    select count(*)::bigint as total from filtered
  ),
  page as (
    select v.*, vp.*
    from filtered v
    left join "variantPricing" vp on v.pricing = vp.id
    order by v.createDate desc, v.id desc
    offset v_from
    limit p_limit
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'shops', v.shops,
        'productID', v.productID,
        'variantGID', v.variantGID,
        'name', v.name,
        'sku', v.sku,
        'price', v.price,
        'createDate', v.createDate,
        'modifiedDate', v.modifiedDate,
        'variantPricing', case when vp.id is not null then to_jsonb(vp.*) else null end
      )
    ) filter (where v.id is not null),
    counted.total
  into v_rows, v_total
  from page v
  left join "variantPricing" vp on v.pricing = vp.id, counted;

  -- 2️⃣ Return combined payload
  return jsonb_build_object(
    'variants', coalesce(v_rows, '[]'::jsonb),
    'count', coalesce(v_total, 0)
  );
end;
$$;
