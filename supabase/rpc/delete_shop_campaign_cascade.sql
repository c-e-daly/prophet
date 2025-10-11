-- =============================================================================
-- fn: delete_shop_campaign_cascade
-- desc: Deletes a campaign and all its associated programs for a given shop.
--       Mirrors deleteShopCampaignCascade.ts logic from Remix.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaign_id  bigint  -- required
-- returns: jsonb summary ({ deleted_programs, deleted_campaign })
-- folders: /rpc/campaigns/delete_shop_campaign_cascade.sql
-- =============================================================================

create or replace function delete_shop_campaign_cascade(
  p_shops_id    bigint,
  p_campaign_id bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_deleted_programs int := 0;
  v_deleted_campaign int := 0;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;
  if p_campaign_id is null or p_campaign_id <= 0 then
    raise exception 'Invalid or missing campaign id.';
  end if;

  -- 1️⃣ Delete all programs linked to this campaign
  delete from programs
  where "campaigns" = p_campaign_id
    and "shops" = p_shops_id;
  get diagnostics v_deleted_programs = row_count;

  -- 2️⃣ Delete the campaign itself
  delete from campaigns
  where "id" = p_campaign_id
    and "shops" = p_shops_id;
  get diagnostics v_deleted_campaign = row_count;

  -- 3️⃣ Return summary JSON
  return jsonb_build_object(
    'deleted_programs', v_deleted_programs,
    'deleted_campaign', v_deleted_campaign
  );
end;
$$;
