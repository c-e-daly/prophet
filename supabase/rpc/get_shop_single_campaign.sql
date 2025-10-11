-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign for a given shop by campaign ID.
--       Mirrors getShopSingleCampaign.ts logic from Remix.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: campaigns
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

create or replace function get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
returns "campaigns"
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_campaign campaigns%rowtype;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  if p_campaigns_id is null or p_campaigns_id <= 0 then
    raise exception 'Invalid or missing campaign id.';
  end if;

  select *
  into v_campaign
  from campaigns
  where shops = p_shops_id
    and id = p_campaigns_id
  limit 1;

  if not found then
    raise exception 'campaign_not_found';
  end if;

  return v_campaign;
end;
$$;
