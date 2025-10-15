-- Function: public.log_webhook_event
-- Purpose: append-only log row for any webhook
-- Works for create/update/paid/fulfilled, checkouts, refunds, etc.

create or replace function public.log_webhook_event(
  _shops_id    int,
  _shop_domain text,
  _topic       text,
  _resource_id text,          -- order id / checkout id as text
  _payload     jsonb,
  _ok          boolean default true,
  _error       text    default null,
  _request_id  text    default null,  -- e.g., Shopify X-Request-Id
  _hmac        text    default null   -- optional: X-Shopify-Hmac-SHA256
)
returns bigint
language plpgsql
as $$
declare
  _id bigint;
begin
  insert into public."webhook_log" (
    "shops",
    "shop_domain",
    "topic",
    "resource_id",
    "payload",
    "ok",
    "error",
    "request_id",
    "hmac",
    "created_at"
  )
  values (
    _shops_id,
    _shop_domain,
    _topic,
    _resource_id,
    coalesce(_payload, '{}'::jsonb),
    coalesce(_ok, true),
    _error,
    _request_id,
    _hmac,
    now()
  )
  returning id into _id;

  return _id;
end $$;

grant execute on function public.log_webhook_event(
  int, text, text, text, jsonb, boolean, text, text, text
) to authenticated, anon;

-- (optional but recommended)
create index if not exists ix_webhook_log_shops_topic_created
  on public."webhook_log" ("shops","topic","created_at" desc);

create index if not exists ix_webhook_log_resource
  on public."webhook_log" ("resource_id");
