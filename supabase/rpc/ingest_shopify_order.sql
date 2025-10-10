-- Function: public.ingest_shopify_order
-- Version: 1.5
-- Updated: 2025-10-10
-- Notes:
--   • Adds parity with more Shopify Order topics:
--     shipping_lines, refunds, returns, fulfillments, tax_lines,
--     discount_codes, discount_applications, client_details,
--     payment_gateway_names, *_set totals, and various scalar fields.
--   • Leaves JSON topics NULL if absent (per request).
--   • Continues to store raw payload for audit/troubleshooting.

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
    id, "shopsID",

    -- core timestamps
    created_at, processed_at, updated_at,

    -- identifiers / naming
    name, order_number, number, token, app_id,

    -- contact / identity
    email, phone, contact_email,

    -- currencies
    currency, presentment_currency,

    -- order totals (scalar)
    subtotal_price, total_tax, total_price, current_total_price,

    -- core JSON anchors
    customer, line_items, billing_address, shipping_address,

    -- statuses
    financial_status, fulfillment_status,

    -- cancellation
    cancelled_at, cancel_reason,

    -- booleans / flags
    test, taxes_included, duties_included, estimated_taxes, buyer_accepts_marketing,

    -- environment / sources
    browser_ip, cart_token, checkout_token, checkout_id,
    source_name, source_identifier, source_url,
    landing_site, referring_site,
    order_status_url,

    -- JSON topics / arrays
    tax_lines, discount_codes, discount_applications,
    shipping_lines, refunds, returns, fulfillments,
    client_details, payment_gateway_names,

    -- *_set totals
    total_tax_set, total_discounts_set, total_line_items_price_set,
    total_price_set, subtotal_price_set,
    current_total_price_set, current_total_tax_set, current_total_discounts_set,
    current_subtotal_price_set,
    total_shipping_price_set, current_shipping_price_set,

    -- raw payload
    raw_payload
  )
  values (
    _id, _shops_id,

    -- timestamps
    safe_ts(_payload->>'created_at'),
    safe_ts(_payload->>'processed_at'),
    safe_ts(_payload->>'updated_at'),

    -- identifiers / naming
    nullif(_payload->>'name',''),
    nullif(_payload->>'order_number','')::int,
    nullif(_payload->>'number','')::int,
    _payload->>'token',
    nullif(_payload->>'app_id','')::bigint,

    -- contact / identity
    _payload->>'email',
    _payload->>'phone',
    _payload->>'contact_email',

    -- currencies
    _payload->>'currency',
    _payload->>'presentment_currency',

    -- scalar totals
    safe_num(_payload->>'subtotal_price'),
    safe_num(_payload->>'total_tax'),
    safe_num(_payload->>'total_price'),
    safe_num(_payload->>'current_total_price'),

    -- core JSON anchors
    _payload->'customer',
    _payload->'line_items',
    _payload->'billing_address',
    _payload->'shipping_address',

    -- statuses
    _payload->>'financial_status',
    _payload->>'fulfillment_status',

    -- cancellation
    safe_ts(_payload->>'cancelled_at'),
    _payload->>'cancel_reason',

    -- booleans / flags
    coalesce((_payload->>'test')::boolean, false),
    coalesce((_payload->>'taxes_included')::boolean, false),
    coalesce((_payload->>'duties_included')::boolean, false),
    coalesce((_payload->>'estimated_taxes')::boolean, false),
    coalesce((_payload->>'buyer_accepts_marketing')::boolean, false),

    -- environment / sources
    _payload->>'browser_ip',
    _payload->>'cart_token',
    _payload->>'checkout_token',
    nullif(_payload->>'checkout_id','')::bigint,
    _payload->>'source_name',
    _payload->>'source_identifier',
    _payload->>'source_url',
    _payload->>'landing_site',
    _payload->>'referring_site',
    _payload->>'order_status_url',

    -- JSON topics / arrays
    _payload->'tax_lines',
    _payload->'discount_codes',
    _payload->'discount_applications',
    _payload->'shipping_lines',
    _payload->'refunds',
    _payload->'returns',
    _payload->'fulfillments',
    _payload->'client_details',
    _payload->'payment_gateway_names',

    -- *_set totals
    _payload->'total_tax_set',
    _payload->'total_discounts_set',
    _payload->'total_line_items_price_set',
    _payload->'total_price_set',
    _payload->'subtotal_price_set',
    _payload->'current_total_price_set',
    _payload->'current_total_tax_set',
    _payload->'current_total_discounts_set',
    _payload->'current_subtotal_price_set',
    _payload->'total_shipping_price_set',
    _payload->'current_shipping_price_set',

    -- raw payload
    _payload
  )
  on conflict (id) do update set
    "shopsID"                   = excluded."shopsID",

    -- timestamps
    created_at                  = excluded.created_at,
    processed_at                = excluded.processed_at,
    updated_at                  = excluded.updated_at,

    -- identifiers / naming
    name                        = excluded.name,
    order_number                = excluded.order_number,
    number                      = excluded.number,
    token                       = excluded.token,
    app_id                      = excluded.app_id,

    -- contact / identity
    email                       = excluded.email,
    phone                       = excluded.phone,
    contact_email               = excluded.contact_email,

    -- currencies
    currency                    = excluded.currency,
    presentment_currency        = excluded.presentment_currency,

    -- scalar totals
    subtotal_price              = excluded.subtotal_price,
    total_tax                   = excluded.total_tax,
    total_price                 = excluded.total_price,
    current_total_price         = excluded.current_total_price,

    -- core JSON anchors
    customer                    = excluded.customer,
    line_items                  = excluded.line_items,
    billing_address             = excluded.billing_address,
    shipping_address            = excluded.shipping_address,

    -- statuses
    financial_status            = excluded.financial_status,
    fulfillment_status          = excluded.fulfillment_status,

    -- cancellation
    cancelled_at                = excluded.cancelled_at,
    cancel_reason               = excluded.cancel_reason,

    -- booleans / flags
    test                        = excluded.test,
    taxes_included              = excluded.taxes_included,
    duties_included             = excluded.duties_included,
    estimated_taxes             = excluded.estimated_taxes,
    buyer_accepts_marketing     = excluded.buyer_accepts_marketing,

    -- environment / sources
    browser_ip                  = excluded.browser_ip,
    cart_token                  = excluded.cart_token,
    checkout_token              = excluded.checkout_token,
    checkout_id                 = excluded.checkout_id,
    source_name                 = excluded.source_name,
    source_identifier           = excluded.source_identifier,
    source_url                  = excluded.source_url,
    landing_site                = excluded.landing_site,
    referring_site              = excluded.referring_site,
    order_status_url            = excluded.order_status_url,

    -- JSON topics / arrays
    tax_lines                   = excluded.tax_lines,
    discount_codes              = excluded.discount_codes,
    discount_applications       = excluded.discount_applications,
    shipping_lines              = excluded.shipping_lines,
    refunds                     = excluded.refunds,
    returns                     = excluded.returns,
    fulfillments                = excluded.fulfillments,
    client_details              = excluded.client_details,
    payment_gateway_names       = excluded.payment_gateway_names,

    -- *_set totals
    total_tax_set               = excluded.total_tax_set,
    total_discounts_set         = excluded.total_discounts_set,
    total_line_items_price_set  = excluded.total_line_items_price_set,
    total_price_set             = excluded.total_price_set,
    subtotal_price_set          = excluded.subtotal_price_set,
    current_total_price_set     = excluded.current_total_price_set,
    current_total_tax_set       = excluded.current_total_tax_set,
    current_total_discounts_set = excluded.current_total_discounts_set,
    current_subtotal_price_set  = excluded.current_subtotal_price_set,
    total_shipping_price_set    = excluded.total_shipping_price_set,
    current_shipping_price_set  = excluded.current_shipping_price_set,

    -- raw payload
    raw_payload                 = excluded.raw_payload;

  return _id;
end $$;
