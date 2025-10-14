-- File: supabase/rpc/get_shop_campaign_prgrams.sql
-- Version: 1.0
-- Desc   : Return a single program, its parent campaign, all goals for the program,
--          and sibling programs (same campaign), in one JSONB payload.

create or replace function get_shop_campaign_programs(
  p_shops_id bigint,
  p_program_id bigint
)
returns jsonb
language plpgsql
as $$
declare
  v_program        public.programs%rowtype;
  v_campaign       public.campaigns%rowtype;
  v_goals          jsonb;
  v_siblings       jsonb;
begin
  -- Program (tenant scoped)
  select *
    into v_program
  from public.programs
  where id = p_program_id
    and shops = p_shops_id;

  if not found then
    return jsonb_build_object(
      'program', null,
      'campaign', null,
      'programGoals', '[]'::jsonb,
      'siblingPrograms', '[]'::jsonb
    );
  end if;

  -- Campaign (1:1 via FK programs.campaigns)
  select *
    into v_campaign
  from public.campaigns
  where id = v_program.campaigns
    and shops = p_shops_id;

  -- All goals for this program (array)
  select coalesce(jsonb_agg(g order by g.created_at desc), '[]'::jsonb)
    into v_goals
  from public."programGoals" g
  where g.shops = p_shops_id
    and g.program = v_program.id;

  -- Sibling programs (same campaign, excluding current)
  select coalesce(jsonb_agg(p order by p.created_at desc), '[]'::jsonb)
    into v_siblings
  from public.programs p
  where p.shops = p_shops_id
    and p.campaigns = v_program.campaigns
    and p.id <> v_program.id;

  return jsonb_build_object(
    'program',        to_jsonb(v_program),
    'campaign',       to_jsonb(v_campaign),
    'programGoals',   v_goals,
    'siblingPrograms',v_siblings
  );
end;
$$;
