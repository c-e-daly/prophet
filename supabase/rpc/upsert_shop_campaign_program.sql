-- =============================================================================
-- fn: upsert_shop_campaign_programs
-- desc: Inserts a new Program for a given shop and campaign.
--       Mirrors createShopProgram.ts logic from Remix.
-- params:
--   p_shops_id        bigint         -- required
--   p_campaigns_id    bigint         -- required
--   p_name            text           -- required
--   p_status          programStatus  -- default 'Draft'
--   p_start_date      timestamptz    -- nullable
--   p_end_date        timestamptz    -- nullable
--   p_code_prefix     text           -- nullable
--   p_focus           programFocus   -- nullable
--   p_expiry_minutes  int            -- default 60
--   p_combine_order_discounts boolean default false
--   p_combine_product_discounts boolean default false
--   p_combine_shipping_discounts boolean default false
--   p_is_default      boolean default false
--   p_accept_rate     numeric default null
--   p_decline_rate    numeric default null
-- returns: programs
-- folders: /rpc/campaigns/upsert_shop_campaign_programs.sql
-- =============================================================================

create or replace function upsert_shop_campaign_programs(
  p_shops_id        bigint,
  p_campaigns_id    bigint,
  p_name            text,
  p_status          "programStatus" default 'Draft',
  p_start_date      timestamptz default null,
  p_end_date        timestamptz default null,
  p_code_prefix     text default null,
  p_focus           "programFocus" default null,
  p_expiry_minutes  int default 60,
  p_combine_order_discounts boolean default false,
  p_combine_product_discounts boolean default false,
  p_combine_shipping_discounts boolean default false,
  p_is_default      boolean default false,
  p_accept_rate     numeric default null,
  p_decline_rate    numeric default null
)
returns setof programs
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_inserted programs%rowtype;
begin
  -- 1️⃣ Validation
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;
  if p_campaigns_id is null or p_campaigns_id <= 0 then
    raise exception 'Invalid or missing campaign id.';
  end if;
  if coalesce(trim(p_name),'') = '' then
    raise exception 'Program name (p_name) is required.';
  end if;
  if p_start_date is not null and p_end_date is not null and p_end_date < p_start_date then
    raise exception 'end_date must be on or after start_date.';
  end if;

  -- 2️⃣ Insert new program
  insert into programs (
    shops,
    campaigns,
    name,
    status,
    startDate,
    endDate,
    codePrefix,
    focus,
    expiryMinutes,
    combineOrderDiscounts,
    combineProductDiscounts,
    combineShippingDiscounts,
    isDefault,
    acceptRate,
    declineRate,
    created_at,
    modifiedDate
  )
  values (
    p_shops_id,
    p_campaigns_id,
    trim(p_name),
    coalesce(p_status, 'Draft'),
    p_start_date,
    p_end_date,
    nullif(trim(p_code_prefix), ''),
    p_focus,
    coalesce(p_expiry_minutes, 60),
    coalesce(p_combine_order_discounts, false),
    coalesce(p_combine_product_discounts, false),
    coalesce(p_combine_shipping_discounts, false),
    coalesce(p_is_default, false),
    p_accept_rate,
    p_decline_rate,
    v_now,
    v_now
  )
  returning * into v_inserted;

  return query select v_inserted.*;
end;
$$;
