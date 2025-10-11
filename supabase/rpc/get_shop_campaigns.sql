-- =============================================================================
-- fn: get_shop_campaigns
-- desc: Returns all campaigns for a given shop, including nested programs.
--       Mirrors getShopCampaigns.ts logic from Remix.
-- params:
--   p_shops_id bigint  -- required
-- returns: setof jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_campaigns.sql
-- =============================================================================

create or replace function get_shop_campaigns(
  p_shops_id bigint
)
returns setof jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_campaign record;
  v_programs jsonb;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  -- Loop through each campaign and nest its programs
  for v_campaign in
    select
      c.id,
      c.shops,
      c.name,
      c.description,
      c."codePrefix",
      c.budget,
      c."startDate",
      c."endDate",
      c.goals,
      c.status,
      c."createDate",
      c."modifiedDate"
    from campaigns c
    where c.shops = p_shops_id
    order by c."createDate" desc
  loop
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'status', coalesce(p.status, 'Draft'),
          'startDate', p."startDate",
          'endDate', p."endDate",
          'focus', p.focus,
          'expiryMinutes', p."expiryMinutes",
          'combineOrderDiscounts', p."combineOrderDiscounts",
          'combineProductDiscounts', p."combineProductDiscounts",
          'combineShippingDiscounts', p."combineShippingDiscounts",
          'acceptRate', p."acceptRate",
          'declineRate', p."declineRate",
          'isDefault', p."isDefault"
        )
        order by p."startDate"
      ),
      '[]'::jsonb
    )
    into v_programs
    from programs p
    where p.shops = p_shops_id
      and p.campaigns = v_campaign.id;

    return next jsonb_build_object(
      'id', v_campaign.id,
      'shops', v_campaign.shops,
      'name', v_campaign.name,
      'description', v_campaign.description,
      'codePrefix', v_campaign."codePrefix",
      'budget', v_campaign.budget,
      'startDate', v_campaign."startDate",
      'endDate', v_campaign."endDate",
      'goals', coalesce(v_campaign.goals, '[]'::jsonb),
      'status', coalesce(v_campaign.status, 'Draft'),
      'createDate', v_campaign."createDate",
      'modifiedDate', v_campaign."modifiedDate",
      'programs', v_programs
    );
  end loop;
end;
$$;
