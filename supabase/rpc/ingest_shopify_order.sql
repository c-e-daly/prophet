-- Function: public.ingest_shopify_order
-- Version: 1.5
-- Updated: 2025-10-15
-- Changes:
--  - Coalesce array/object JSONB nodes to [] / {}
--  - Upsert key JSONB nodes used by views (shipping_lines, fulfillments, refunds, returns, discount_*,
--    tax_lines, payment_gateway_names, *_price_set, client_details, addresses)
--  - Uses "shops" (rename to "shopsID" here if your table uses that column name)

create or replace function public.ingest_shopify_order(
  _shops_id int,
  _payload  jsonb
) returns bigint
language plpgsql
as $$
declare
  _id bigint := (_payload->>'id')::bigint;
begin
  insert into public."shopifyOrders" as o (
    id, "shops",
    created_at, processed_at, updated_at,
    order_number, name, email, phone,
    currency, presentment_currency,
    subtotal_price, total_tax, total_price, current_total_price,
    total_line_items_price, current_subtotal_price,
    financial_status, fulfillment_status,
    cancelled_at, cancel_reason,
    -- JSONB arrays/objects (coalesced)
    customer,
    line_items, shipping_lines, fulfillments, refunds, returns,
    discount_codes, discount_applications, tax_lines, payment_gateway_names,
    client_details,
    subtotal_price_set, total_price_set, total_tax_set, total_discounts_set, total_shipping_price_set,
    current_total_price_set, current_total_tax_set, current_subtotal_price_set, current_shipping_price_set, current_total_discounts_set,
    billing_address, shipping_address,
    raw_payload
  )
  values (
    _id, _shops_id,
    safe_ts(_payload->>'created_at'),
    safe_ts(_payload->>'processed_at'),
    safe_ts(_payload->>'updated_at'),
    nullif(_payload->>'order_number','')::int,
    _payload->>'name',
    _payload->>'email',
    _payload->>'phone',
    _payload->>'currency',
    _payload->>'presentment_currency',
    safe_num(_payload->>'subtotal_price'),
    safe_num(_payload->>'total_tax'),
    safe_num(_payload->>'total_price'),
    safe_num(_payload->>'current_total_price'),
    safe_num(_payload->>'total_line_items_price'),
    safe_num(_payload->>'current_subtotal_price'),
    _payload->>'financial_status',
    _payload->>'fulfillment_status',
    safe_ts(_payload->>'cancelled_at'),
    _payload->>'cancel_reason',
    -- coalesced JSONB
    coalesce(_payload->'customer', '{}'),
    coalesce(_payload->'line_items', '[]'),
    coalesce(_payload->'shipping_lines', '[]'),
    coalesce(_payload->'fulfillments', '[]'),
    coalesce(_payload->'refunds', '[]'),
    coalesce(_payload->'returns', '[]'),
    coalesce(_payload->'discount_codes', '[]'),
    coalesce(_payload->'discount_applications', '[]'),
    coalesce(_payload->'tax_lines', '[]'),
    coalesce(_payload->'payment_gateway_names', '[]'),
    coalesce(_payload->'client_details', '{}'),
    coalesce(_payload->'subtotal_price_set', '{}'),
    coalesce(_payload->'total_price_set', '{}'),
    coalesce(_payload->'total_tax_set', '{}'),
    coalesce(_payload->'total_discounts_set', '{}'),
    coalesce(_payload->'total_shipping_price_set', '{}'),
    coalesce(_payload->'current_total_price_set', '{}'),
    coalesce(_payload->'current_total_tax_set', '{}'),
    coalesce(_payload->'current_subtotal_price_set', '{}'),
    coalesce(_payload->'current_shipping_price_set', '{}'),
    coalesce(_payload->'current_total_discounts_set', '{}'),
    coalesce(_payload->'billing_address', '{}'),
    coalesce(_payload->'shipping_address', '{}'),
    _payload
  )
  on conflict (id) do update set
    "shops"                = excluded."shops",
    created_at             = excluded.created_at,
    processed_at           = excluded.processed_at,
    updated_at             = excluded.updated_at,
    order_number           = excluded.order_number,
    name                   = excluded.name,
    email                  = excluded.email,
    phone                  = excluded.phone,
    currency               = excluded.currency,
    presentment_currency   = excluded.presentment_currency,
    subtotal_price         = excluded.subtotal_price,
    total_tax              = excluded.total_tax,
    total_price            = excluded.total_price,
    current_total_price    = excluded.current_total_price,
    total_line_items_price = excluded.total_line_items_price,
    current_subtotal_price = excluded.current_subtotal_price,
    financial_status       = excluded.financial_status,
    fulfillment_status     = excluded.fulfillment_status,
    cancelled_at           = excluded.cancelled_at,
    cancel_reason          = excluded.cancel_reason,
    customer               = excluded.customer,
    line_items             = excluded.line_items,
    shipping_lines         = excluded.shipping_lines,
    fulfillments           = excluded.fulfillments,
    refunds                = excluded.refunds,
    returns                = excluded.returns,
    discount_codes         = excluded.discount_codes,
    discount_applications  = excluded.discount_applications,
    tax_lines              = excluded.tax_lines,
    payment_gateway_names  = excluded.payment_gateway_names,
    client_details         = excluded.client_details,
    subtotal_price_set     = excluded.subtotal_price_set,
    total_price_set        = excluded.total_price_set,
    total_tax_set          = excluded.total_tax_set,
    total_discounts_set    = excluded.total_discounts_set,
    total_shipping_price_set   = excluded.total_shipping_price_set,
    current_total_price_set    = excluded.current_total_price_set,
    current_total_tax_set      = excluded.current_total_tax_set,
    current_subtotal_price_set = excluded.current_subtotal_price_set,
    current_shipping_price_set = excluded.current_shipping_price_set,
    current_total_discounts_set= excluded.current_total_discounts_set,
    billing_address        = excluded.billing_address,
    shipping_address       = excluded.shipping_address,
    raw_payload            = excluded.raw_payload;

  return _id;
end $$;
