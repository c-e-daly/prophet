-- sypabase/rpc/upsert_shop_single_variant_price.sql
create or replace function upsert_shop_single_variant_price(
  -- REQUIRED first (no defaults)
  p_variants             bigint,
  p_shops                bigint,
  p_allowance_discounts  numeric,
  p_effective_price      numeric,

  -- OPTIONAL after (all have defaults)
  p_profit_markup        numeric default null,
  p_allowance_shrink     numeric default null,
  p_allowance_shipping   numeric default null,
  p_allowance_finance    numeric default null,
  p_market_adjustment    numeric default null,
  p_published            boolean default false,
  p_published_price      numeric default null,
  p_published_date       timestamptz default null,
  p_created_by_user      bigint default null
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_publishing boolean := coalesce(p_published, false);
  v_inserted_id bigint;
begin
  -- Validation
  if p_variants is null then raise exception 'Missing variant id'; end if;
  if p_shops is null then raise exception 'Missing shop id'; end if;
  if p_effective_price is null then raise exception 'Effective price is required'; end if;
  if p_allowance_discounts is null then raise exception 'Allowance discounts is required'; end if;
  if v_publishing and p_published_price is null then
    raise exception 'When published=true, published_price is required';
  end if;

  -- Unpublish current if publishing
  if v_publishing then
    update "variantPricing"
    set "isPublished" = false,
        "modifiedDate" = v_now
    where "variants" = p_variants
      and "isPublished" = true;
  end if;

  -- Insert new pricing row (preserve history)
  insert into "variantPricing" (
    "variants",
    "shops",
    "profitMarkup",
    "allowanceShrink",
    "allowanceShipping",
    "allowanceFinance",
    "allowanceDiscounts",
    "marketAdjustment",
    "effectivePrice",
    "isPublished",
    "publishedPrice",
    "publishedDate",
    "createDate",
    "modifiedDate",
    "createdByUser",
    "productID",
    "variantID"
  )
  values (
    p_variants,
    p_shops,
    p_profit_markup,
    p_allowance_shrink,
    p_allowance_shipping,
    p_allowance_finance,
    p_allowance_discounts,
    p_market_adjustment,
    p_effective_price,
    v_publishing,
    case when v_publishing then p_published_price else null end,
    case when v_publishing then coalesce(p_published_date, v_now) else null end,
    v_now,
    v_now,
    p_created_by_user,
    '',  -- keep schema parity
    ''
  )
  returning id into v_inserted_id;

  return v_inserted_id;
end;
$$;
