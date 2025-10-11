-- =============================================================================
-- fn: upsert_shop_accet_counter_offer
-- desc: Accepts a counter offer and updates its status + accepted amount.
--       Also increments the acceptance stats on the linked counterTemplate.
-- params:
--   p_counter_offer_id   bigint     -- required
--   p_accepted_amount    numeric    -- required (in cents)
-- returns: counterOffers
-- folders: /rpc/counter_offers/upsert_accept_shop_counter_offer.sql
-- =============================================================================

create or replace function upsert_shop_accetp_counter_offer(
  p_counter_offer_id bigint,
  p_accepted_amount  numeric
)
returns setof counterOffers
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now          timestamptz := now();
  v_template_id  bigint;
  v_template     record;
  v_updated      counterOffers%rowtype;
begin
  if p_counter_offer_id is null then
    raise exception 'p_counter_offer_id is required';
  end if;

  if p_accepted_amount is null or p_accepted_amount <= 0 then
    raise exception 'p_accepted_amount must be > 0';
  end if;

  -- 1️⃣ Update the counter offer itself
  update counterOffers
  set
    offerStatus         = 'Consumer Accepted',
    finalAmountCents    = p_accepted_amount,
    consumerResponseDate = v_now,
    modifedDate         = v_now  -- intentionally matches typo in schema
  where id = p_counter_offer_id
  returning * into v_updated;

  if not found then
    raise exception 'Counter offer ID % not found', p_counter_offer_id;
  end if;

  -- 2️⃣ If it has a template, update the stats on counterTemplates
  select counterTemplateID
  into v_template_id
  from counterOffers
  where id = p_counter_offer_id
  limit 1;

  if v_template_id is not null then
    select accepted, usage
    into v_template
    from counterTemplates
    where id = v_template_id;

    if found then
      update counterTemplates
      set
        accepted     = coalesce(v_template.accepted, 0) + 1,
        acceptRate   = case
                         when coalesce(v_template.usage, 0) > 0
                         then ((coalesce(v_template.accepted, 0) + 1) / v_template.usage::numeric) * 100
                         else 0
                       end,
        modifiedDate = v_now
      where id = v_template_id;
    end if;
  end if;

  return query select v_updated.*;
end;
$$;
