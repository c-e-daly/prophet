- =============================================================================
-- fn: get_shop_single_program
-- desc: Returns a single program for a shop and a list of all non-archived campaigns.
--       Mirrors getShopSingleProgram.ts logic from Remix.
-- params:
--   p_shops_id   bigint  -- required
--   p_programs_id bigint -- required
-- returns: jsonb { program: {...}, campaigns: [...] }
-- folders: /rpc/campaigns/get_shop_campaign_single_program.sql
-- =============================================================================

create or replace function get_shop_campaign_single_program(
  p_shops_id   bigint,
  p_programs_id bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_program   programs%rowtype;
  v_campaigns jsonb;
begin
  if p_shops_id is null or p_shops_id <= 0 then
    raise exception 'Invalid or missing shop id.';
  end if;

  if p_programs_id is null or p_programs_id <= 0 then
    raise exception 'Invalid or missing program id.';
  end if;

  -- 1️⃣ Fetch the program
  select *
  into v_program
  from programs
  where shops = p_shops_id
    and id = p_programs_id;

  if not found then
    raise exception 'program_not_found';
  end if;

  -- 2️⃣ Fetch non-archived campaigns (for dropdown)
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name
      )
      order by c.name asc
    ),
    '[]'::jsonb
  )
  into v_campaigns
  from campaigns c
  where c.shops = p_shops_id
    and c.status <> 'Archived';

  -- 3️⃣ Return unified result
  return jsonb_build_object(
    'program', to_jsonb(v_program),
    'campaigns', v_campaigns
  );
end;
$$;
