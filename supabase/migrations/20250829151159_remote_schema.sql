

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."campaignStatus" AS ENUM (
    'Draft',
    'Pending',
    'Active',
    'Paused',
    'Complete',
    'Archived'
);


ALTER TYPE "public"."campaignStatus" OWNER TO "postgres";


CREATE TYPE "public"."cartStatus" AS ENUM (
    'Abandoned',
    'Offered',
    'Checkout',
    'Expired',
    'Closed-Won',
    'Closed-Lost'
);


ALTER TYPE "public"."cartStatus" OWNER TO "postgres";


CREATE TYPE "public"."consumerDeclineReasons" AS ENUM (
    'Price Too High',
    'Options Not Available',
    'Just Browsing',
    'Not Ready To Buy',
    'Does Not Meet My Needs',
    'Other'
);


ALTER TYPE "public"."consumerDeclineReasons" OWNER TO "postgres";


COMMENT ON TYPE "public"."consumerDeclineReasons" IS 'why a consumer declines a counter offer';



CREATE TYPE "public"."discountStatus" AS ENUM (
    'Active',
    'Claimed',
    'Cancelled',
    'Expired - Not Used'
);


ALTER TYPE "public"."discountStatus" OWNER TO "postgres";


COMMENT ON TYPE "public"."discountStatus" IS 'the status of a discount from a customer generated offer';



CREATE TYPE "public"."goalMetric" AS ENUM (
    'Consumers',
    'Orders',
    'Units',
    'Bundles',
    'Items',
    'Dollars',
    'Percent'
);


ALTER TYPE "public"."goalMetric" OWNER TO "postgres";


CREATE TYPE "public"."offerType" AS ENUM (
    'Customer Generated Offer',
    'Shop Private Offer',
    'Shop Counter Offer',
    'Consumer Counter Offer'
);


ALTER TYPE "public"."offerType" OWNER TO "postgres";


COMMENT ON TYPE "public"."offerType" IS 'types of offers';



CREATE TYPE "public"."offer_status" AS ENUM (
    'Auto Accepted',
    'Auto Declined',
    'Pending Review',
    'Counter Accepted',
    'Counter Declined',
    'Reviewed Accepted',
    'Reviewed Countered',
    'Reviewed Declined',
    'Accepted Expired',
    'Counter Accepted Expired'
);


ALTER TYPE "public"."offer_status" OWNER TO "postgres";


CREATE TYPE "public"."portfolioPeriod" AS ENUM (
    '12 Months',
    '6 Months',
    '3 Months'
);


ALTER TYPE "public"."portfolioPeriod" OWNER TO "postgres";


CREATE TYPE "public"."programFocus" AS ENUM (
    'Acquisition',
    'Growth',
    'Reactivation',
    'Reverse Declining',
    'Inventory Clearance'
);


ALTER TYPE "public"."programFocus" OWNER TO "postgres";


COMMENT ON TYPE "public"."programFocus" IS 'the macro objective of the program';



CREATE TYPE "public"."programGoal" AS ENUM (
    'Gross Margin',
    'Maintained Markup',
    'Average Order Value',
    'New Customers',
    'Reactivate Customers',
    'Increase LTV',
    'Conversion Rate',
    'Category Sell Through',
    'Unit Volume',
    'Transaction Volume',
    'Other'
);


ALTER TYPE "public"."programGoal" OWNER TO "postgres";


COMMENT ON TYPE "public"."programGoal" IS 'Goals for programs';



CREATE TYPE "public"."programStatus" AS ENUM (
    'Draft',
    'Pending',
    'Active',
    'Paused',
    'Complete',
    'Archived'
);


ALTER TYPE "public"."programStatus" OWNER TO "postgres";


CREATE TYPE "public"."promotionTypes" AS ENUM (
    'Percent off Item',
    'Percent off Order',
    'Percent off Next Order',
    'Price Markdown',
    'Price Markdown Order',
    'Bounceback Current',
    'Bounceback Future',
    'Threshold One',
    'Threshold Two',
    'Purchase With Purchase',
    'Gift With Purchase',
    'Flat Shipping',
    'Free Shipping',
    'Flat Shipping Upgrade',
    'Price Markdown Multi-Units',
    'Price Markdown Bundle'
);


ALTER TYPE "public"."promotionTypes" OWNER TO "postgres";


COMMENT ON TYPE "public"."promotionTypes" IS 'types of promotional offers for consumers';



CREATE TYPE "public"."sellerDeclineReasons" AS ENUM (
    'Offer Too Low',
    'Out of Stock',
    'Service Issue',
    'Fulfillment Issue',
    'Other'
);


ALTER TYPE "public"."sellerDeclineReasons" OWNER TO "postgres";


COMMENT ON TYPE "public"."sellerDeclineReasons" IS 'reason for declining an offer ';



CREATE TYPE "public"."sellerUserRoles" AS ENUM (
    'Account Admin',
    'Campaign Admin',
    'Customer Service User',
    'Customer Service Admin'
);


ALTER TYPE "public"."sellerUserRoles" OWNER TO "postgres";


COMMENT ON TYPE "public"."sellerUserRoles" IS 'different roles with different access';



CREATE TYPE "public"."subscriptionStatus" AS ENUM (
    'Active',
    'Cancelled',
    'Ended',
    'Paused - Seller',
    'Paused - User',
    'Pending',
    'Refunded',
    'Trial Stage'
);


ALTER TYPE "public"."subscriptionStatus" OWNER TO "postgres";


CREATE TYPE "public"."userType" AS ENUM (
    'IWT Admin',
    'IWT Service',
    'Consumer',
    'Consumer App',
    'Shop Owner',
    'Shop Associate'
);


ALTER TYPE "public"."userType" OWNER TO "postgres";


COMMENT ON TYPE "public"."userType" IS 'types of users for I Want That! apps';



CREATE OR REPLACE FUNCTION "public"."consumer_12m_install"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- For install mode - process ALL consumers with orders in last 12 months
  
  -- 1. Capture ALL consumer/shop combos with orders in last 12 months
  WITH target_consumers AS (
    SELECT DISTINCT consumer, shop
    FROM orders
    WHERE order_date_time >= CURRENT_DATE - INTERVAL '12 months'
  ),

  inserted AS (
    INSERT INTO consumer_12m (consumer, shop, created_at)
    SELECT consumer, shop, CURRENT_TIMESTAMP
    FROM target_consumers
    ON CONFLICT (consumer, shop) DO NOTHING
    RETURNING consumer, shop
  ),

  updated_set AS (
    SELECT * FROM target_consumers
    UNION
    SELECT * FROM inserted
  ),

  -- Calculate 12M metrics
  metrics AS (
    SELECT
      o.consumer,
      o.shop,
      SUM(o.gross_sales) AS gross_sales,
      SUM(o.return_sales) AS gross_returns,
      SUM(o.gross_items) AS gross_items,
      SUM(o.gross_units) AS gross_units,
      SUM(o.return_items) AS return_items,
      SUM(o.return_units) AS return_units,
      SUM(o.gross_discounts) AS gross_discounts,
      SUM(o.return_discounts) AS return_discounts,
      COUNT(*) AS orders,
      SUM(o.gross_shipping_sales) AS gross_shipping_sales,
      SUM(o.gross_shipping_cost) AS gross_shipping_cost,
      SUM(o.return_shipping_sales) AS return_shipping_sales,
      SUM(o.return_shipping_cost) AS return_shipping_cost,
      SUM(o.categories_shopped) AS categories_shopped,
      MAX(o.order_date_time)::date AS last_purchase_date
    FROM orders o
    JOIN updated_set u ON o.consumer = u.consumer AND o.shop = u.shop
    WHERE o.order_date_time >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY o.consumer, o.shop
  )

  -- Update consumer_12m with calculated metrics
  UPDATE consumer_12m c
  SET
    gross_sales = m.gross_sales,
    gross_returns = m.gross_returns,
    gross_items = m.gross_items,
    gross_units = m.gross_units,
    return_items = m.return_items,
    return_units = m.return_units,
    gross_discounts = m.gross_discounts,
    return_discounts = m.return_discounts,
    orders = m.orders,
    gross_shipping_sales = m.gross_shipping_sales,
    gross_shipping_cost = m.gross_shipping_cost,
    return_shipping_sales = m.return_shipping_sales,
    return_shipping_cost = m.return_shipping_cost,
    categories_shopped = m.categories_shopped,
    last_purchase_date = m.last_purchase_date,
    shops_shopped = 1
  FROM metrics m
  WHERE c.consumer = m.consumer AND c.shop = m.shop;

  -- Null out inactive consumers
  UPDATE consumer_12m
  SET
    monetary = NULL,
    frequency = NULL,
    recency = NULL
  WHERE
    (gross_sales IS NULL OR gross_sales = 0)
    AND (orders IS NULL OR orders = 0)
    AND last_purchase_date IS NULL;

  -- RFM scoring on ALL processed records
  WITH target_consumers AS (
    SELECT DISTINCT consumer, shop
    FROM orders
    WHERE order_date_time >= CURRENT_DATE - INTERVAL '12 months'
  ),
  
  scored AS (
    SELECT
      c.id,
      NTILE(3) OVER (PARTITION BY c.shop ORDER BY c.gross_sales DESC NULLS LAST) AS monetary,
      NTILE(3) OVER (PARTITION BY c.shop ORDER BY c.orders DESC NULLS LAST) AS frequency,
      CASE
        WHEN CURRENT_DATE - c.last_purchase_date <= 30 THEN 1
        WHEN CURRENT_DATE - c.last_purchase_date <= 90 THEN 2
        WHEN c.last_purchase_date IS NOT NULL THEN 3
        ELSE NULL
      END AS recency
    FROM consumer_12m c
    JOIN target_consumers u ON c.consumer = u.consumer AND c.shop = u.shop
    WHERE c.gross_sales IS NOT NULL AND c.gross_sales > 0
      AND c.orders IS NOT NULL AND c.orders > 0
      AND c.last_purchase_date IS NOT NULL
  )
  UPDATE consumer_12m c
  SET
    monetary = s.monetary,
    frequency = s.frequency,
    recency = s.recency
  FROM scored s
  WHERE c.id = s.id;
END;$$;


ALTER FUNCTION "public"."consumer_12m_install"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consumer_12m_update"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- 1. Capture all (consumer, shop) combos with new orders today
  WITH updated_today AS (
    SELECT DISTINCT consumer, shop
    FROM orders
    WHERE created_at::date = CURRENT_DATE
  ),

  inserted AS (
    INSERT INTO consumer_12m (consumer, shop, created_at)
    SELECT consumer, shop, CURRENT_TIMESTAMP
    FROM updated_today
    ON CONFLICT (consumer, shop) DO NOTHING
    RETURNING consumer, shop
  ),

  updated_set AS (
    SELECT * FROM updated_today
    UNION
    SELECT * FROM inserted
  ),

  -- 4. Calculate 12M metrics
  metrics AS (
    SELECT
      o.consumer,
      o.shop,
      SUM(o.gross_sales) AS gross_sales,
      SUM(o.return_sales) AS gross_returns,
      SUM(o.gross_items) AS gross_items,
      SUM(o.gross_units) AS gross_units,
      SUM(o.return_items) AS return_items,
      SUM(o.return_units) AS return_units,
      SUM(o.gross_discounts) AS gross_discounts,
      SUM(o.return_discounts) AS return_discounts,
      COUNT(*) AS orders,
      SUM(o.gross_shipping_sales) AS gross_shipping_sales,
      SUM(o.gross_shipping_cost) AS gross_shipping_cost,
      SUM(o.return_shipping_sales) AS return_shipping_sales,
      SUM(o.return_shipping_cost) AS return_shipping_cost,
      SUM(o.categories_shopped) AS categories_shopped,
      MAX(o.order_date_time)::date AS last_purchase_date
    FROM orders o
    JOIN updated_set u ON o.consumer = u.consumer AND o.shop = u.shop
    WHERE o.order_date_time >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY o.consumer, o.shop
  )

  -- Update consumer_12m with calculated metrics
  UPDATE consumer_12m c
  SET
    gross_sales = m.gross_sales,
    gross_returns = m.gross_returns,
    gross_items = m.gross_items,
    gross_units = m.gross_units,
    return_items = m.return_items,
    return_units = m.return_units,
    gross_discounts = m.gross_discounts,
    return_discounts = m.return_discounts,
    orders = m.orders,
    gross_shipping_sales = m.gross_shipping_sales,
    gross_shipping_cost = m.gross_shipping_cost,
    return_shipping_sales = m.return_shipping_sales,
    return_shipping_cost = m.return_shipping_cost,
    categories_shopped = m.categories_shopped,
    last_purchase_date = m.last_purchase_date,
    shops_shopped = 1
  FROM metrics m
  WHERE c.consumer = m.consumer AND c.shop = m.shop;

  -- 5. Null out inactive consumers
  UPDATE consumer_12m
  SET
    monetary = NULL,
    frequency = NULL,
    recency = NULL
  WHERE
    (gross_sales IS NULL OR gross_sales = 0)
    AND (orders IS NULL OR orders = 0)
    AND last_purchase_date IS NULL;

  -- 6. RFM scoring on updated records
  WITH updated_set AS (
    SELECT DISTINCT consumer, shop
    FROM orders
    WHERE created_at::date = CURRENT_DATE
  ),
  
  scored AS (
    SELECT
      c.id,
      NTILE(3) OVER (PARTITION BY c.shop ORDER BY c.gross_sales DESC NULLS LAST) AS monetary,
      NTILE(3) OVER (PARTITION BY c.shop ORDER BY c.orders DESC NULLS LAST) AS frequency,
      CASE
        WHEN CURRENT_DATE - c.last_purchase_date <= 30 THEN 1
        WHEN CURRENT_DATE - c.last_purchase_date <= 90 THEN 2
        WHEN c.last_purchase_date IS NOT NULL THEN 3
        ELSE NULL
      END AS recency
    FROM consumer_12m c
    JOIN updated_set u ON c.consumer = u.consumer AND c.shop = u.shop
    WHERE c.gross_sales IS NOT NULL AND c.gross_sales > 0
      AND c.orders IS NOT NULL AND c.orders > 0
      AND c.last_purchase_date IS NOT NULL
  )
  UPDATE consumer_12m c
  SET
    monetary = s.monetary,
    frequency = s.frequency,
    recency = s.recency
  FROM scored s
  WHERE c.id = s.id;
END;$$;


ALTER FUNCTION "public"."consumer_12m_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consumer_geolocation"("p_shop_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$declare
  v_shop_id bigint;
begin
  -- Map Shopify GID -> internal shops.id
  select s.id into v_shop_id
  from public.shops s
  where s.shop_id = p_shop_id
  limit 1;

  if v_shop_id is null then
    return '{}'::jsonb;
  end if;

  return (
    with scf_data as (
      select 
        left(coalesce(c.postal_code, '000'), 3) as scf,
        o.created_at,
        o.gross_sales + o.gross_shipping_sales - o.gross_discounts as nor_sales,
        o.gross_sales + o.gross_shipping_sales as gross_sales,
        o.consumer,
        o.gross_units - o.return_units as units
      from public.orders o
      join public.consumers c
        on c.id = o.consumer
       and o.shop = v_shop_id
      where o.shop = v_shop_id
        and o.created_at is not null
        and c.postal_code is not null
        and o.created_at >= current_date - interval '24 months'
    ),
    current_12m as (
      select 
        scf,
        count(distinct consumer) as consumers,
        sum(nor_sales) as spend,
        count(*) as orders,
        sum(units) as units
      from scf_data
      where created_at >= current_date - interval '12 months'
      group by scf
    ),
    prior_12m as (
      select 
        scf,
        count(distinct consumer) as consumers,
        sum(nor_sales) as spend,
        count(*) as orders,
        sum(units) as units
      from scf_data
      where created_at >= current_date - interval '24 months'
        and created_at < current_date - interval '12 months'
      group by scf
    ),
    combined as (
      select 
        coalesce(c.scf, p.scf) as scf,
        jsonb_build_object(
          'consumers', coalesce(c.consumers, 0),
          'spend', coalesce(c.spend, 0),
          'orders', coalesce(c.orders, 0),
          'units', coalesce(c.units, 0)
        ) as current_12m,
        jsonb_build_object(
          'consumers', coalesce(p.consumers, 0),
          'spend', coalesce(p.spend, 0),
          'orders', coalesce(p.orders, 0),
          'units', coalesce(p.units, 0)
        ) as prior_12m,
        jsonb_build_object(
          'consumers', coalesce(c.consumers, 0) - coalesce(p.consumers, 0),
          'spend', coalesce(c.spend, 0) - coalesce(p.spend, 0),
          'orders', coalesce(c.orders, 0) - coalesce(p.orders, 0),
          'units', coalesce(c.units, 0) - coalesce(p.units, 0)
        ) as delta,
        jsonb_build_object(
          'consumers',
            case when coalesce(p.consumers, 0) = 0 then null
            else round(
                ((coalesce(c.consumers, 0)::numeric - coalesce(p.consumers, 0)::numeric)
                 / nullif(p.consumers::numeric, 0)) * 100, 2)
            end,
          'spend',
            case when coalesce(p.spend, 0) = 0 then null
            else round(
                ((coalesce(c.spend, 0)::numeric - coalesce(p.spend, 0)::numeric)
                 / nullif(p.spend::numeric, 0)) * 100, 2)
            end,
          'orders',
            case when coalesce(p.orders, 0) = 0 then null
            else round(
                ((coalesce(c.orders, 0)::numeric - coalesce(p.orders, 0)::numeric)
                 / nullif(p.orders::numeric, 0)) * 100, 2)
            end,
          'units',
            case when coalesce(p.units, 0) = 0 then null
          else round(
                ((coalesce(c.units, 0)::numeric - coalesce(p.units, 0)::numeric)
                 / nullif(p.units::numeric, 0)) * 100, 2)
          end
) as percent_change

      from current_12m c
      full outer join prior_12m p on c.scf = p.scf
      where coalesce(c.scf, p.scf) != '000' -- Filter out invalid/missing zip codes
    )
    select jsonb_build_object(
      'summary', jsonb_build_object(
        'total_scfs', count(*),
        'current_12m_totals', jsonb_build_object(
          'consumers', sum((current_12m->>'consumers')::numeric),
          'spend', sum((current_12m->>'spend')::numeric),
          'orders', sum((current_12m->>'orders')::numeric),
          'units', sum((current_12m->>'units')::numeric)
        ),
        'prior_12m_totals', jsonb_build_object(
          'consumers', sum((prior_12m->>'consumers')::numeric),
          'spend', sum((prior_12m->>'spend')::numeric),
          'orders', sum((prior_12m->>'orders')::numeric),
          'units', sum((prior_12m->>'units')::numeric)
        )
      ),
      'scf_data', jsonb_agg(
        jsonb_build_object(
          'scf', scf,
          'current_12m', current_12m,
          'prior_12m', prior_12m,
          'delta', delta,
          'percent_change', percent_change
        )
        order by (current_12m->>'spend')::numeric desc
      )
    )
    from combined
  );
end;$$;


ALTER FUNCTION "public"."consumer_geolocation"("p_shop_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dashboard_sales_summary"("p_shop_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$declare
  v_shop_id bigint;
begin
  -- Map Shopify GID -> internal shops.id
  select s.id into v_shop_id
  from public.shops s
  where s.shop_id = p_shop_id
  limit 1;

  if v_shop_id is null then
    return '{}'::jsonb; -- or null if you prefer
  end if;

  return (
    -- Build the JSON payload (seed mode: no date windows, just NOT NULL)
    select jsonb_build_object(
      'today', (
        select jsonb_build_object(
          'order_count', count(*),
          'gross_sales', coalesce(sum(gross_sales + gross_shipping_sales), 0),
          'nor_sales',   coalesce(sum(gross_sales + gross_shipping_sales - gross_discounts), 0),
          'consumers',   count(distinct consumer),
          'aov', case when count(*) = 0 then 0
                      else sum(gross_sales + gross_shipping_sales) / count(*) end
        )
        from public.orders
        where shop = v_shop_id
          and created_at is not null
          -- and created_at::date = current_date
      ),
      'wtd', (
        select jsonb_build_object(
          'order_count', count(*),
          'gross_sales', coalesce(sum(gross_sales + gross_shipping_sales), 0),
          'nor_sales',   coalesce(sum(gross_sales + gross_shipping_sales - gross_discounts), 0),
          'consumers',   count(distinct consumer),
          'aov', case when count(*) = 0 then 0
                      else sum(gross_sales + gross_shipping_sales) / count(*) end
        )
        from public.orders
        where shop = v_shop_id
          and created_at is not null
          -- and created_at >= date_trunc('week', current_date)
      ),
      'mtd', (
        select jsonb_build_object(
          'order_count', count(*),
          'gross_sales', coalesce(sum(gross_sales + gross_shipping_sales), 0),
          'nor_sales',   coalesce(sum(gross_sales + gross_shipping_sales - gross_discounts), 0),
          'consumers',   count(distinct consumer),
          'aov', case when count(*) = 0 then 0
                      else sum(gross_sales + gross_shipping_sales) / count(*) end
        )
        from public.orders
        where shop = v_shop_id
          and created_at is not null
          -- and created_at >= date_trunc('month', current_date)
      ),
      'ytd', (
        select jsonb_build_object(
          'order_count', count(*),
          'gross_sales', coalesce(sum(gross_sales + gross_shipping_sales), 0),
          'nor_sales',   coalesce(sum(gross_sales + gross_shipping_sales - gross_discounts), 0),
          'consumers',   count(distinct consumer),
          'aov', case when count(*) = 0 then 0
                      else sum(gross_sales + gross_shipping_sales) / count(*) end
        )
        from public.orders
        where shop = v_shop_id
          and created_at is not null
          -- and created_at >= date_trunc('year', current_date)
      ),
      'nor_by_month', (
  with months as (
    select date_trunc('month', current_date) - (interval '1 month' * g.m) as m
    from generate_series(0, extract(month from current_date)::int - 1) g(m)
  ),
  cy as (
    select date_trunc('month', o.created_at) m,
           sum(o.gross_sales + o.gross_shipping_sales - o.gross_discounts) nor
    from public.orders o
    where o.shop =v_shop_id
      and o.created_at >= date_trunc('year', current_date)
    group by 1
  ),
  py as (
    select date_trunc('month', o.created_at) m,
           sum(o.gross_sales + o.gross_shipping_sales - o.gross_discounts) nor
    from public.orders o
    where o.shop = v_shop_id
      and o.created_at >= date_trunc('year', current_date) - interval '1 year'
      and o.created_at <  date_trunc('year', current_date)
    group by 1
  )
  select jsonb_agg(
           jsonb_build_object(
             'date', to_char(m.m, 'YYYY-MM-01'),
             'cy', coalesce(cy.nor, 0),
             'py', coalesce(py.nor, 0)
           )
           order by m.m
         )
  from months m
  left join cy on cy.m = m.m
  left join py on py.m = m.m - interval '1 year'
),

'nor_by_week_13', (
  with weeks as (
    select date_trunc('week', current_date) - (interval '1 week' * g.w) as w
    from generate_series(0, 12) g(w)
  ),
  cy as (
    select date_trunc('week', o.created_at) w,
           sum(o.gross_sales + o.gross_shipping_sales - o.gross_discounts) nor
    from public.orders o
    where o.shop = v_shop_id
      and o.created_at >= date_trunc('week', current_date) - interval '12 weeks'
    group by 1
  )
  select jsonb_agg(
           jsonb_build_object(
             'date', to_char(w.w, 'YYYY-MM-DD'),
             'cy', coalesce(cy.nor, 0)
           )
           order by w.w
         )
  from weeks w
  left join cy on cy.w = w.w
)
      
    )
  );
end;$$;


ALTER FUNCTION "public"."dashboard_sales_summary"("p_shop_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gdpr-consumer-request"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  data JSONB;
  offers_data JSONB;
  carts_data JSONB;
  cartitems_data JSONB;
  discounts_data JSONB;
  orders_data JSONB;
BEGIN
  -- Only process if type is 'customers/data_request' and consumer/shop FKs are set
  IF NEW.request_type = 'customers/data_request' AND NEW.consumer IS NOT NULL AND NEW.shop IS NOT NULL THEN

    -- Collect related data
    SELECT to_jsonb(c.*) INTO data FROM consumers c WHERE c.id = NEW.consumer;
    SELECT jsonb_agg(to_jsonb(o)) INTO offers_data FROM offers o WHERE o.consumer = NEW.consumer;
    SELECT jsonb_agg(to_jsonb(ct)) INTO carts_data FROM carts ct WHERE ct.consumer = NEW.consumer;
    SELECT jsonb_agg(to_jsonb(ci)) INTO cartitems_data FROM cartitems ci WHERE ci.consumer = NEW.consumer;
    SELECT jsonb_agg(to_jsonb(d)) INTO discounts_data FROM discounts d WHERE d.consumer = NEW.consumer;
    SELECT jsonb_agg(to_jsonb(orq)) INTO orders_data FROM orders orq WHERE orq.consumer = NEW.consumer;

    -- Merge into one payload
    data := jsonb_build_object(
      'consumer', data,
      'offers', offers_data,
      'carts', carts_data,
      'cartitems', cartitems_data,
      'discounts', discounts_data,
      'orders', orders_data
    );

    -- Insert into gdprconsumerreq
    INSERT INTO gdprconsumerreq (
      gdprrequest_id,
      consumer_id,
      shop_id,
      customer_email,
      customerGID,
      shop_domain,
      requested_date,
      request_completed,
      status,
      payload
    )
    VALUES (
      NEW.id,
      NEW.consumer,
      NEW.shop,
      NEW.customer_email,
      (SELECT customerGID FROM consumers WHERE id = NEW.consumer),
      NEW.shop_domain,
      NEW.received_at,
      NOW(),
      'complete',
      data
    );
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."gdpr-consumer-request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gdpr-shop-redact"("shopid" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  v_consumer_gid text;
  v_order_id text;
  v_consumer_id uuid;
  v_payload jsonb;
BEGIN
  -- Only respond to 'customer_data_request' type
  IF NEW.type = 'customer_data_request' THEN

    -- Extract customer GID and order ID from payload
    v_consumer_gid := NEW.payload->>'customer_id';  -- this is Shopify's GID
    v_order_id := NEW.payload->>'orders';           -- assuming this is a JSON array

    -- Look up the Supabase consumer.id from customerGID
    SELECT id INTO v_consumer_id
    FROM consumers
    WHERE customergid = v_consumer_gid
    LIMIT 1;

    -- Compose JSON payload of consumer-related data for the requested order
    SELECT jsonb_build_object(
      'consumer', (SELECT row_to_json(c) FROM consumers c WHERE c.id = v_consumer_id),
      'orders', (SELECT jsonb_agg(row_to_json(o)) FROM orders o WHERE o.consumer_id = v_consumer_id AND o.orderid = ANY (SELECT jsonb_array_elements_text(NEW.payload->'orders'))),
      'carts', (SELECT jsonb_agg(row_to_json(ct)) FROM carts ct WHERE ct.consumer_id = v_consumer_id),
      'offers', (SELECT jsonb_agg(row_to_json(of)) FROM offers of WHERE of.consumer_id = v_consumer_id),
      'cartItems', (SELECT jsonb_agg(row_to_json(ci)) FROM cartitems ci WHERE ci.consumer_id = v_consumer_id)
    )
    INTO v_payload;

    -- Insert into gdprconsumerreq with the compiled payload
    INSERT INTO gdprconsumerreq (gdpr_request_id, consumer_id, payload)
    VALUES (NEW.id, v_consumer_id, v_payload);

  END IF;

END;$$;


ALTER FUNCTION "public"."gdpr-shop-redact"("shopid" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gdprrequest-foreign-keys"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Resolve consumer if email is present and not a shop redact
  IF NEW.customer_email IS NOT NULL AND NEW.request_type != 'shop/redact' THEN
    UPDATE gdprrequests
    SET consumer = c.id
    FROM consumers c
    WHERE c.email = NEW.customer_email AND gdprrequests.id = NEW.id;
  END IF;

  -- Resolve shop
  IF NEW.shop_id IS NOT NULL THEN
    UPDATE gdprrequests
    SET shop = s.id
    FROM shops s
    WHERE s.shop_id = NEW.shop_id AND gdprrequests.id = NEW.id;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."gdprrequest-foreign-keys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_enums"("enum_schema" "text" DEFAULT 'public'::"text", "enum_types" "text"[] DEFAULT NULL::"text"[]) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  with enum_lists as (
    select
      t.typname as enum_name,
      array_agg(e.enumlabel order by e.enumsortorder) as labels
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = enum_schema
      and (enum_types is null or t.typname = any(enum_types))
    group by t.typname
  )
  select coalesce(
    jsonb_object_agg(enum_name, to_jsonb(labels)),
    '{}'::jsonb
  )
  from enum_lists;
$$;


ALTER FUNCTION "public"."get_all_enums"("enum_schema" "text", "enum_types" "text"[]) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addressbook" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contactName" "text",
    "contactEmail" "text",
    "contactPhone" "text",
    "addressLabel" "text",
    "streetNumber" "text",
    "streetName" "text",
    "city" "text",
    "province" "text",
    "state" "text",
    "postalCode" "text",
    "geoAddress" "jsonb",
    "createdBy" "text",
    "createDate" timestamp with time zone,
    "modifiedDate" timestamp with time zone,
    "userid" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."addressbook" OWNER TO "postgres";


COMMENT ON TABLE "public"."addressbook" IS 'consumer user address book for ship to cost estimates.';



ALTER TABLE "public"."addressbook" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."address_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."billing" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."billing" OWNER TO "postgres";


ALTER TABLE "public"."billing" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."billing_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."campaignGoals" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "goal" "text" NOT NULL,
    "campaign" bigint,
    "goalMetric" "text" NOT NULL,
    "goalValue" numeric NOT NULL,
    "shop" bigint
);


ALTER TABLE "public"."campaignGoals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."campaignGoals"."goal" IS 'one or two goals for a campaign effort';



COMMENT ON COLUMN "public"."campaignGoals"."campaign" IS 'foreign key to campaigns';



ALTER TABLE "public"."campaignGoals" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."campaignGoals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."campaignMetrics" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "grossSales" numeric,
    "grossDiscounts" numeric,
    "grossShippingSales" numeric,
    "returnSales" numeric,
    "returnShippingCost" numeric,
    "returnUnits" integer,
    "returnDiscounts" numeric,
    "grossUnits" integer,
    "orders" integer,
    "grossItems" integer,
    "returnItems" integer,
    "campaign" bigint,
    "grossShippingCost" numeric,
    "returnShippingSales" numeric
);


ALTER TABLE "public"."campaignMetrics" OWNER TO "postgres";


COMMENT ON COLUMN "public"."campaignMetrics"."campaign" IS 'foreign key reference to campaigns';



ALTER TABLE "public"."campaignMetrics" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."campaignResults_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "codePrefix" "text",
    "createDate" timestamp with time zone,
    "createdBy" "uuid",
    "modifiedDate" timestamp with time zone,
    "shopDomain" "text",
    "campaignName" "text",
    "shop" bigint NOT NULL,
    "isDefault" boolean NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "description" "text",
    "budget" numeric,
    "status" "public"."campaignStatus" DEFAULT 'Draft'::"public"."campaignStatus" NOT NULL,
    "campaignGoals" "jsonb",
    "campaignDates" "jsonb",
    "bbl_campaigns" "text",
    "bbl_merchants" "text",
    "bbl_programs" "text"
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


ALTER TABLE "public"."campaigns" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."campaigns_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."cartitems" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "storeUrl" "text",
    "modifiedDate" timestamp with time zone,
    "createDate" timestamp with time zone,
    "productName" "text",
    "productGID" "text",
    "variantQuantity" integer,
    "template" "text",
    "variantSKU" "text",
    "productCartKey" "text",
    "createdBy" "text",
    "variantID" "text" NOT NULL,
    "variantSellingPrice" numeric,
    "offerToken" "text",
    "cartToken" "text" NOT NULL,
    "variantGID" "text",
    "productHTML" "text",
    "carts" bigint,
    "shops" bigint,
    "productID" "text",
    "products" bigint,
    "variants" bigint,
    "offers" bigint,
    "variantSettlementPrice" numeric,
    "bbl_carts" "text",
    "bbl_merchants" "text",
    "bbl_offers" "text",
    "bbl_cartitems" "text",
    "itemTotalPrice" numeric,
    "productImageURL" "text",
    "variantImageURL" "text"
);


ALTER TABLE "public"."cartitems" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cartitems"."carts" IS 'foreign key to carts';



COMMENT ON COLUMN "public"."cartitems"."shops" IS 'foreign key to shops';



COMMENT ON COLUMN "public"."cartitems"."products" IS 'foreign key to products';



COMMENT ON COLUMN "public"."cartitems"."variants" IS 'foreign key to variants';



COMMENT ON COLUMN "public"."cartitems"."offers" IS 'foreign key to offers';



COMMENT ON COLUMN "public"."cartitems"."variantSettlementPrice" IS 'final settled price for the variant';



ALTER TABLE "public"."cartitems" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."cartitems_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cartUnitCount" integer,
    "cartUrl" "text",
    "cartToken" "text",
    "cartItemCount" integer,
    "cartItemsSubtotal" numeric,
    "modifiedDate" timestamp with time zone,
    "createDate" timestamp with time zone,
    "cartTotalPrice" numeric,
    "cartCreateDate" timestamp with time zone,
    "createdBy" "text",
    "cartStatus" "text",
    "shop" bigint,
    "consumers" bigint,
    "bbl_consumers" "text",
    "bbl_offers" "text",
    "bbl_shopid" "text",
    "cartProfitMarkup" numeric,
    "cartDiscountMarkup" numeric,
    "cartShrinkMarkup" numeric,
    "cartFinanceMarkup" numeric,
    "cartMarketMarkup" numeric,
    "cartOtherMarkup" numeric,
    "cartUpdateDate" timestamp with time zone,
    "bbl_carts" "text",
    "bbl_cartitems" "text"[],
    "bbl_merchants" "text",
    "offer" bigint[],
    "offers" bigint
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."carts"."shop" IS 'foreign key to shops';



COMMENT ON COLUMN "public"."carts"."consumers" IS 'foreign key to consumers';



ALTER TABLE "public"."carts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."carts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consumer12m" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumer" bigint,
    "shop" bigint,
    "grossSales" numeric,
    "grossReturns" numeric,
    "grossItems" integer,
    "grossUnits" integer,
    "returnItems" integer,
    "returnUnits" integer,
    "grossDiscounts" numeric,
    "returnDiscounts" numeric,
    "orders" integer,
    "grossCOGS" numeric,
    "returnCOGS" numeric,
    "lastPurchaseDate" "date",
    "grossShippingSales" numeric,
    "grossShippingCost" numeric,
    "returnShippingSales" numeric,
    "returnShippingCost" numeric,
    "categoriesShopped" integer,
    "shopsShopped" integer,
    "recency" smallint,
    "frequency" smallint,
    "monetary" smallint
);


ALTER TABLE "public"."consumer12m" OWNER TO "postgres";


COMMENT ON TABLE "public"."consumer12m" IS '12month performance for consumers by shop';



COMMENT ON COLUMN "public"."consumer12m"."grossSales" IS '12 month gross sales';



COMMENT ON COLUMN "public"."consumer12m"."shopsShopped" IS 'number of shops shopped at during 12M period';



ALTER TABLE "public"."consumer12m" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consumer12M_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consumerCategoryIndex" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumer" bigint,
    "shop" bigint,
    "category" "text"
);


ALTER TABLE "public"."consumerCategoryIndex" OWNER TO "postgres";


ALTER TABLE "public"."consumerCategoryIndex" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consumerCategoryIndex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consumerLTV" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumer" bigint,
    "firstPurchaseDate" "date",
    "lastPurchaseDate" "date",
    "grossSales" numeric,
    "grossItems" bigint,
    "grossUnits" bigint,
    "grossShippingSales" numeric,
    "grossShippingCost" numeric,
    "grossDiscounts" numeric,
    "grossFinanceCost" numeric,
    "grossShrinkCost" numeric,
    "grossProfitMarkup" numeric,
    "returnSales" numeric,
    "returnItems" bigint,
    "returnUnits" bigint,
    "returnDiscounts" numeric,
    "returnShippingSales" numeric,
    "returnShippingCost" numeric,
    "grossCOGS" numeric,
    "returnCOGS" numeric,
    "returnProfitMarkup" numeric,
    "uniqueCategoriesShopped" bigint,
    "highestOrderValue" numeric,
    "lowestOrderValue" numeric
);


ALTER TABLE "public"."consumerLTV" OWNER TO "postgres";


COMMENT ON COLUMN "public"."consumerLTV"."consumer" IS 'foreign key to consumers';



ALTER TABLE "public"."consumerLTV" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consumerLTV_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consumerPortfolioMeasures" (
    "id" bigint NOT NULL,
    "shop" "uuid",
    "createdby" "text",
    "createDate" timestamp with time zone,
    "modifieDate" timestamp with time zone,
    "cpGrossReturns" numeric(10,2),
    "cpReturnSales" numeric(10,2),
    "cpGrossSrinkCost" numeric(10,2),
    "cpOrders" integer,
    "cpGrossItems" integer,
    "cpReturnUnits" integer,
    "cpReturnItems" integer,
    "cpReturnDiscounts" numeric(10,2),
    "cpGrossSales" numeric(10,2),
    "cpGrossFinanceCost" numeric(10,2),
    "cpGrossShippingCost" numeric(10,2),
    "cpProfitMarkup" numeric(10,2),
    "cpStoresShopped" integer,
    "ppReturnSales" numeric(10,2),
    "ppGrossShrinkCost" numeric(10,2),
    "ppGrossUnits" integer,
    "ppGrossItems" integer,
    "ppReturnUnits" integer,
    "ppReturnItems" integer,
    "ppGrossDiscounts" numeric(10,2),
    "ppGrossSales" numeric(10,2),
    "ppGrossFinanceCost" numeric(10,2),
    "ppGrossShipCost" numeric(10,2),
    "ppProfitMarkup" numeric(10,2),
    "ppCategoriesShopped" integer,
    "ppGrossCOGS" numeric(10,2),
    "ppStoresShopped" integer,
    "consumer" bigint,
    "periodType" "text",
    "cpStartDate" "date",
    "cpEndDate" "date",
    "ppStartDate" "date",
    "ppEndDate" "date",
    "ppReturnCOGS" numeric,
    "cxpGrossCOGS" numeric,
    "cpReturnCOGS" numeric
);


ALTER TABLE "public"."consumerPortfolioMeasures" OWNER TO "postgres";


COMMENT ON COLUMN "public"."consumerPortfolioMeasures"."consumer" IS 'foreign key to consumers';



CREATE TABLE IF NOT EXISTS "public"."consumerPortfolioScores" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumer" bigint,
    "cpQuintile" smallint,
    "cpStartDate" "date",
    "cpEndDate" "date",
    "ppQuintile" smallint,
    "ppStartDate" "date",
    "ppEndDate" "date",
    "shop" bigint,
    "portfolioPeriod" "public"."portfolioPeriod" NOT NULL
);


ALTER TABLE "public"."consumerPortfolioScores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consumerShopMetrics" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumer" bigint,
    "shop" bigint
);


ALTER TABLE "public"."consumerShopMetrics" OWNER TO "postgres";


ALTER TABLE "public"."consumerPortfolioScores" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consumer_protfolio_scores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."consumerPortfolioMeasures" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consumermetrics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consumers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stateProvince" "text",
    "phone" "text",
    "firstName" "text",
    "customerGID" "text",
    "carts" "text"[],
    "displayName" "text",
    "geoAddress" "jsonb",
    "created_by" "text",
    "address" "text",
    "city" "text",
    "postalCode" "text",
    "lastName" "text",
    "email" "text",
    "merchant" "text"[],
    "createDate" timestamp with time zone,
    "offers" "text"[],
    "modified_date" timestamp with time zone,
    "storeUrl" "text"[],
    "shops" bigint[],
    "consumerShops" bigint,
    "bbl_offers" "text",
    "bbl_merchants" "text",
    "bbl_orders" "text",
    "bbl_uuid" "text",
    "bbl_carts" "text"
);


ALTER TABLE "public"."consumers" OWNER TO "postgres";


ALTER TABLE "public"."consumers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consumers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."consumerShopMetrics" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."cosnumerShops_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."discounts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "modifiedDate" timestamp with time zone,
    "combineProduct" boolean,
    "expiryEndDate" "text",
    "emailRestriction" "text",
    "code" "text",
    "expiryStartDate" "text",
    "usageCount" integer,
    "cartToken" "text",
    "bbl_merchant" "text",
    "discountTitle" "text",
    "combineShipping" boolean,
    "shopifyCustomerGID" "text",
    "createDateAPI" "text",
    "createDate" timestamp with time zone,
    "datecreated" timestamp with time zone,
    "createdBy" "text",
    "discountAmount" numeric(10,2),
    "combineOrders" boolean,
    "consumer" bigint,
    "shop" bigint,
    "order" bigint
);


ALTER TABLE "public"."discounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."discounts"."consumer" IS 'foreign key to consumers';



COMMENT ON COLUMN "public"."discounts"."shop" IS 'foreign key to shops';



COMMENT ON COLUMN "public"."discounts"."order" IS 'foreign key to orders';



ALTER TABLE "public"."discounts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."discounts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."gdprrequests" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shop_id" integer,
    "shop_domain" "text",
    "customer_email" "text",
    "customer_phone" "text",
    "customer_id" "text",
    "request_type" "text",
    "orders_to_redact" "text",
    "orders_requested" "text",
    "data_request_id" "text",
    "created_by" "text",
    "created_date" timestamp with time zone,
    "modified_date" timestamp with time zone,
    "shop" bigint,
    "consumer" bigint,
    "consumerGID" integer
);


ALTER TABLE "public"."gdprrequests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."gdprrequests"."shop" IS 'foreign key to shops';



COMMENT ON COLUMN "public"."gdprrequests"."consumer" IS 'foreign key to consumer';



COMMENT ON COLUMN "public"."gdprrequests"."consumerGID" IS 'consumer shopify gid value';



ALTER TABLE "public"."gdprrequests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."gdprRequests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."gdprconsumerreq" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shop_domain" "text",
    "customerGID" "text",
    "customer_email" "text",
    "requested_date" timestamp with time zone,
    "payload" "jsonb",
    "status" "text",
    "reqeust_completed" timestamp with time zone,
    "shop" bigint,
    "consumer" bigint
);


ALTER TABLE "public"."gdprconsumerreq" OWNER TO "postgres";


COMMENT ON TABLE "public"."gdprconsumerreq" IS 'GDPR Consumer Requests Data';



COMMENT ON COLUMN "public"."gdprconsumerreq"."shop" IS 'shop foreign key to shops';



COMMENT ON COLUMN "public"."gdprconsumerreq"."consumer" IS 'consumer foreign key to consumers';



ALTER TABLE "public"."gdprconsumerreq" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."gdprconsumerreq_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."interests" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "createdby" "uuid",
    "modifiedDate" timestamp with time zone,
    "specificInterests" "text",
    "interestCategory" "text",
    "createDate" timestamp with time zone,
    "user" bigint,
    "possibleProducts" "jsonb"[],
    "possibleShops" "jsonb"[]
);


ALTER TABLE "public"."interests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."interests"."user" IS 'foreign key to users';



ALTER TABLE "public"."interests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."interests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."oauth_states" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "state" "text",
    "shop_id" bigint,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."oauth_states" OWNER TO "postgres";


ALTER TABLE "public"."oauth_states" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."oauth_states_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."offerMetrics" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."offerMetrics" OWNER TO "postgres";


ALTER TABLE "public"."offerMetrics" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."offerMetrics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "modifiedDate" timestamp with time zone,
    "createDate" timestamp with time zone,
    "createdBy" "text",
    "offerPrice" numeric(10,2),
    "storeUrl" "text",
    "consumerEmail" "text",
    "offerStatus" "text",
    "discountCode" "text",
    "approvedDiscountPrice" numeric(10,2),
    "offerExpiryStart" timestamp with time zone,
    "offerExpiryEnd" timestamp with time zone,
    "cartToken" "text",
    "offerDiscountPercent" numeric(5,4),
    "offerToken" "text",
    "cartTotalPrice" numeric(10,2),
    "consumerName" "text",
    "offerItems" integer,
    "offerDiscountPrice" numeric(10,2),
    "offerUnits" integer,
    "offerTOSCheckedDate" timestamp with time zone,
    "offerCreateDate" timestamp with time zone,
    "programAcceptRate" numeric(5,4),
    "offerExpiryMinutes" integer,
    "programDeclineRate" numeric(5,4),
    "programName" "text",
    "campaignName" "text",
    "campaignCode" "text",
    "storeBrand" "text",
    "calendarWeek" numeric,
    "checkoutUrl" "text",
    "approvedPrice" numeric(10,2),
    "campaigns" bigint,
    "programs" bigint,
    "consumers" bigint,
    "shops" bigint,
    "carts" bigint,
    "periods" bigint,
    "bbl_shop" "text",
    "bbl_consumers" "text",
    "cartProfitMarkup" numeric,
    "cartTotalMarkup" numeric,
    "bbl_carts" "text",
    "bbl_programs" "text",
    "bbl_campaigns" "text",
    "bbl_offers" "text",
    "bbl_periods" "text",
    "offerDeclineDate" timestamp with time zone,
    "bbl_merchants" "text",
    "bbl_cartitems" "text",
    "approvedUnits" numeric,
    "approvedItems" numeric,
    "offerApprovedDate" timestamp with time zone,
    "programCode" "text"
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


ALTER TABLE "public"."offers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."offers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orderDiscounts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order" bigint,
    "discount" bigint
);


ALTER TABLE "public"."orderDiscounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."orderDiscounts" IS 'reference table orders and discounts';



ALTER TABLE "public"."orderDiscounts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orderDiscounts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "offer" bigint,
    "consumer" bigint,
    "shop" bigint,
    "grossSales" numeric,
    "grossDiscounts" numeric,
    "grossShippingSales" numeric,
    "returnSales" numeric,
    "returnDiscounts" numeric,
    "grossItems" bigint,
    "grossUnits" bigint,
    "returItems" bigint,
    "returnUnits" bigint,
    "orderDateTime" timestamp with time zone,
    "paymentMethod" "text",
    "salesChannel" "text",
    "grossShippingCost" numeric,
    "returnShippingCost" numeric,
    "returnShippingSales" numeric,
    "categoriesShopped" smallint,
    "cart" bigint,
    "discount" bigint
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."offer" IS 'foreign key to offers';



COMMENT ON COLUMN "public"."orders"."consumer" IS 'foreign key to consumers';



COMMENT ON COLUMN "public"."orders"."shop" IS 'foreign key to shops';



ALTER TABLE "public"."orders" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."periods" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "calendarWKDAY" "text",
    "calendarDayOfWeek" integer,
    "calendarMonth" integer,
    "calendarWeek" smallint,
    "calendarYear" "text",
    "calendarWK" "text",
    "calendarDateEnd" timestamp with time zone,
    "calendarMNTH" "text",
    "calendarQuarter" integer,
    "createdby" "text",
    "calendarQTR" "text",
    "createDate" timestamp with time zone,
    "modifiedDate" timestamp with time zone,
    "calendarDateStart" timestamp with time zone,
    "bbl_periods" "text"
);


ALTER TABLE "public"."periods" OWNER TO "postgres";


ALTER TABLE "public"."periods" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."periods_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "modifiedDate" timestamp with time zone,
    "createdBy" "text",
    "createdDate" timestamp with time zone,
    "price" numeric(10,2),
    "trialDays" integer,
    "isOneTime" boolean,
    "slug" "text",
    "cappedAmount" numeric(10,2),
    "name" "text",
    "interval" "text",
    "terms" "text",
    "returnUrl" "text"
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


ALTER TABLE "public"."plans" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."plans_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "createDate" timestamp with time zone,
    "createdBy" "text",
    "modifiedDate" timestamp with time zone,
    "productName" "text",
    "productRegularPrice" numeric,
    "productGID" "text",
    "productID" "text",
    "shops" bigint,
    "category" bigint,
    "productComparePrice" numeric,
    "productImageURL" "text",
    "productIMUPrice" numeric,
    "bbl_merchants" "text",
    "bbl_variants" "text",
    "bbl_products" "text",
    "description" "text",
    "shortDescription" "text",
    "bbl_category" "text",
    "variants" bigint[]
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."shops" IS 'foreign key to shops';



ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."programMetrics" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."programMetrics" OWNER TO "postgres";


ALTER TABLE "public"."programMetrics" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."programMetrics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."programgoals" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "goalType" "public"."programGoal" NOT NULL,
    "program" bigint NOT NULL,
    "goalMetric" "public"."goalMetric",
    "goalValue" numeric
);


ALTER TABLE "public"."programgoals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."programgoals"."goalType" IS 'value of the goal target';



COMMENT ON COLUMN "public"."programgoals"."program" IS 'program reference';



ALTER TABLE "public"."programgoals" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."program_goals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "combineShippingDiscounts" boolean,
    "isDefault" boolean,
    "programFocus" "public"."programFocus",
    "combineProductDiscounts" boolean,
    "codePrefix" "text",
    "combineOrderDiscounts" boolean,
    "programName" "text",
    "acceptRate" numeric,
    "declineRate" numeric,
    "createdBy" "uuid",
    "expiryTimeMinutes" integer,
    "modifiedDate" timestamp with time zone,
    "createDate" timestamp with time zone,
    "campaigns" bigint,
    "shop" bigint,
    "status" "public"."programStatus" DEFAULT 'Draft'::"public"."programStatus" NOT NULL,
    "startDate" timestamp with time zone DEFAULT "now"(),
    "endDate" timestamp with time zone DEFAULT "now"(),
    "programGoal" "public"."programGoal",
    "bbl_merchants" "text",
    "bbl_campaigns" "text",
    "bbl_periods" "text",
    "bbl_programs" "text",
    "discountPrefix" "text",
    "description" "text"
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."programs"."campaigns" IS 'foreign key to campaigns';



COMMENT ON COLUMN "public"."programs"."shop" IS 'foreignkey to shops';



ALTER TABLE "public"."programs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."programs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reportName" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "runType" "text" DEFAULT 'edge_function'::"text" NOT NULL,
    "functionName" "text" NOT NULL,
    "promptFields" "jsonb" DEFAULT '[]'::"jsonb",
    "enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sessionid" "text",
    "shop" "text",
    "state" "text",
    "isonline" boolean,
    "scope" "text",
    "expires" timestamp with time zone,
    "access_token" "text",
    "userid" bigint,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "account_owner" boolean,
    "locale" "text",
    "collaborator" boolean,
    "email_verified" boolean
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


ALTER TABLE "public"."sessions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopBilling" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shop" bigint
);


ALTER TABLE "public"."shopBilling" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shopBilling"."shop" IS 'foreign key to shops';



ALTER TABLE "public"."shopBilling" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopBilling_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopSettings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shop" bigint
);


ALTER TABLE "public"."shopSettings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shopSettings"."shop" IS 'foreign key to shops';



ALTER TABLE "public"."shopSettings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopSettings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopstores" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "createdby" "text",
    "storeaddress" "jsonb",
    "hasstorefront" boolean,
    "hasdiscounts" boolean,
    "storecheckoutapi" boolean,
    "storename" "text",
    "storeurl" "text",
    "email" "text",
    "modifieddate" timestamp with time zone,
    "city" "text",
    "countrycode" "text",
    "createddate" timestamp with time zone,
    "storeid" "text",
    "domain" "text",
    "hasgiftcards" boolean,
    "phone" "text",
    "shop" bigint
);


ALTER TABLE "public"."shopstores" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shopstores"."shop" IS 'foreign key to shops';



ALTER TABLE "public"."shopstores" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopStores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopauth" (
    "id" "text" NOT NULL,
    "created_date" timestamp with time zone,
    "createdBy" "text",
    "modifiedDate" timestamp with time zone,
    "shopifyScope" "text",
    "accessToken" "text",
    "shop" bigint,
    "shopName" "text",
    "shop_id" bigint
);


ALTER TABLE "public"."shopauth" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shopauth"."shop" IS 'foreign key to shops';



CREATE TABLE IF NOT EXISTS "public"."shops" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "modified_date" timestamp with time zone,
    "shopDomain" "text",
    "companyPhone" "text",
    "signupValidationToken" "text",
    "storeCurrency" "text",
    "createdBy" "uuid",
    "companyAddress" "jsonb",
    "brandName" "text",
    "shopAuth" "uuid",
    "storeLogo" "text",
    "companyLegalName" "text",
    "createDate" timestamp with time zone,
    "commercePlatform" "text",
    "shopID" bigint,
    "bbl_merchants" "text"
);


ALTER TABLE "public"."shops" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shops"."shopID" IS 'Shopify Shop ID';



ALTER TABLE "public"."shops" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shops_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."storeleads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "domain" "text",
    "average_product_price" "text",
    "average_product_price_usd" "text",
    "categories" "text",
    "city" "text",
    "company_ids" "text",
    "company_location" "text",
    "country_code" "text",
    "created" "date",
    "currency" "text",
    "description" "text",
    "domain_url" "text",
    "emails" "text",
    "employee_count" integer,
    "estimated_monthly_pageviews" integer,
    "estimated_monthly_sales" "text",
    "estimated_monthly_visits" integer,
    "estimated_yearly_sales" "text",
    "facebook" "text",
    "instagram" "text",
    "linkedin_account" "text",
    "linkedin_url" "text",
    "maximum_product_price" "text",
    "merchant_name" "text",
    "meta_description" "text",
    "meta_keywords" "text",
    "minimum_product_price" "text",
    "most_recent_product_title" "text",
    "phones" "text",
    "pinterest" "text",
    "pinterest_followers" integer,
    "plan" "text",
    "platform" "text",
    "platform_rank" integer,
    "product_variants" integer,
    "products_created_365" integer,
    "products_sold" integer,
    "rank" integer,
    "sales_channels" "text",
    "state" "text",
    "status" "text",
    "street_address" "text",
    "tiktok" "text",
    "tiktok_followers" integer,
    "tiktok_url" "text",
    "twitter" "text",
    "twitter_followers" integer,
    "youtube" "text",
    "youtube_followers" integer,
    "youtube_url" "text",
    "zip" integer,
    "campaign" "text",
    "avgmonthlytraffic" integer,
    "avgannualtraffic" integer,
    "avgmonthlysales" double precision,
    "avgannualsales" double precision,
    "avgproductprice" double precision,
    "highproductprice" double precision,
    "lowproductprice" double precision,
    "currencycode" "text",
    "selected" boolean,
    "selecteddate" timestamp without time zone
);


ALTER TABLE "public"."storeleads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "createddate" timestamp with time zone,
    "createdby" "uuid",
    "startdate" timestamp with time zone,
    "user" "uuid",
    "interval" "text",
    "trialstartdate" timestamp with time zone,
    "hsdealid" "text",
    "modifieddate" timestamp with time zone,
    "plan" "uuid",
    "enddate" timestamp with time zone,
    "subscriptiongid" "text",
    "confirmationurl" "text",
    "status" "text",
    "renewalautomatically" boolean,
    "apierror" "text",
    "usedfreetrail" boolean,
    "shop" bigint
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."subscriptions"."shop" IS 'foreign key to shops';



ALTER TABLE "public"."subscriptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."userBilling" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."userBilling" OWNER TO "postgres";


ALTER TABLE "public"."userBilling" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userBilling_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."userProfile" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."userProfile" OWNER TO "postgres";


ALTER TABLE "public"."userProfile" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userProfile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lastname" "text",
    "profilepicture" "text",
    "rolepermissions" "text",
    "usersignedup" boolean,
    "authemail" "text",
    "authemailconfirmed" boolean,
    "onboardingcampaign" "text",
    "hscontactid" "text",
    "tosagreement" boolean,
    "modifieddate" timestamp with time zone,
    "phonenumber" "text",
    "merchant" "uuid",
    "storeurl" "text",
    "tosagreementdate" timestamp with time zone,
    "onboardingstart" boolean,
    "createddate" timestamp with time zone,
    "firstname" "text",
    "userid" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."variants" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sellingPrice" numeric,
    "variantCost" numeric,
    "variantSKU" "text",
    "isDefault" boolean,
    "productVariantGID" "text",
    "createdBy" "text",
    "shopifyPrice" numeric,
    "inventoryQuantity" integer,
    "allowanceShrink" numeric,
    "productVariantID" "text",
    "settlementPrice" numeric,
    "createDate" timestamp with time zone,
    "profitMarkup" numeric,
    "modifiedDate" timestamp with time zone,
    "allowanceDiscounts" numeric,
    "IMUPrice" numeric,
    "variantName" "text",
    "marketMarkup" numeric,
    "allowanceFinancing" numeric,
    "allowanceShipping" numeric,
    "shop" bigint,
    "products" bigint,
    "allowanceOther" numeric,
    "bbl_variants" "text",
    "bbl_merchants" "text",
    "bbl_products" "text",
    "priceBuilderJSON" "jsonb",
    "pricePublishDate" timestamp with time zone,
    "pricePublished" boolean,
    "variantImageURL" "text"
);


ALTER TABLE "public"."variants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."variants"."shop" IS 'foreign key to shops';



ALTER TABLE "public"."variants" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."addressbook"
    ADD CONSTRAINT "address_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing"
    ADD CONSTRAINT "billing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaignGoals"
    ADD CONSTRAINT "campaignGoals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaignMetrics"
    ADD CONSTRAINT "campaignResults_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_cart_variant_uniq" UNIQUE ("cartToken", "variantID");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumer12m"
    ADD CONSTRAINT "consumer12M_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumerCategoryIndex"
    ADD CONSTRAINT "consumerCategoryIndex_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumerLTV"
    ADD CONSTRAINT "consumerLTV_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumerPortfolioScores"
    ADD CONSTRAINT "consumer_protfolio_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumer12m"
    ADD CONSTRAINT "consumer_shop_unique" UNIQUE ("consumer", "shop");



ALTER TABLE ONLY "public"."consumerPortfolioMeasures"
    ADD CONSTRAINT "consumermetrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumers"
    ADD CONSTRAINT "consumers_customerGID_key" UNIQUE ("customerGID");



ALTER TABLE ONLY "public"."consumers"
    ADD CONSTRAINT "consumers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."consumers"
    ADD CONSTRAINT "consumers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumerShopMetrics"
    ADD CONSTRAINT "cosnumerShops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gdprrequests"
    ADD CONSTRAINT "gdprRequests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gdprconsumerreq"
    ADD CONSTRAINT "gdprconsumerreq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_states"
    ADD CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offerMetrics"
    ADD CONSTRAINT "offerMetrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orderDiscounts"
    ADD CONSTRAINT "orderDiscounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."periods"
    ADD CONSTRAINT "periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programMetrics"
    ADD CONSTRAINT "programMetrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programgoals"
    ADD CONSTRAINT "program_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_report_name_key" UNIQUE ("reportName");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopBilling"
    ADD CONSTRAINT "shopBilling_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopSettings"
    ADD CONSTRAINT "shopSettings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopstores"
    ADD CONSTRAINT "shopStores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopauth"
    ADD CONSTRAINT "shopauth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_store_url_key" UNIQUE ("shopDomain");



ALTER TABLE ONLY "public"."storeleads"
    ADD CONSTRAINT "storeleads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userBilling"
    ADD CONSTRAINT "userBilling_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userProfile"
    ADD CONSTRAINT "userProfile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_consumermetrics_shop" ON "public"."consumerPortfolioMeasures" USING "btree" ("shop");



CREATE OR REPLACE TRIGGER "gdpr-consumer-data-request" AFTER UPDATE ON "public"."gdprrequests" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "resolve-gdpr-foreign-keys" AFTER UPDATE ON "public"."gdprrequests" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "send-to-clay" AFTER UPDATE ON "public"."storeleads" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://hook.us2.make.com/q23tbp6wapwe75816rko9bsg64n2sd7p', 'POST', '{}', '{}', '5000');



ALTER TABLE ONLY "public"."addressbook"
    ADD CONSTRAINT "addressbook_userid_fkey" FOREIGN KEY ("userid") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."campaignGoals"
    ADD CONSTRAINT "campaignGoals_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."campaignGoals"
    ADD CONSTRAINT "campaignGoals_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."campaignMetrics"
    ADD CONSTRAINT "campaignMetrics_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_carts_fkey" FOREIGN KEY ("carts") REFERENCES "public"."carts"("id");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_offers_fkey" FOREIGN KEY ("offers") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_products_fkey" FOREIGN KEY ("products") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_shops_fkey" FOREIGN KEY ("shops") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."cartitems"
    ADD CONSTRAINT "cartitems_variants_fkey" FOREIGN KEY ("variants") REFERENCES "public"."variants"("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_consumers_fkey" FOREIGN KEY ("consumers") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_offers_fkey" FOREIGN KEY ("offers") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."consumer12m"
    ADD CONSTRAINT "consumer12M_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."consumer12m"
    ADD CONSTRAINT "consumer12M_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."consumerCategoryIndex"
    ADD CONSTRAINT "consumerCategoryIndex_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."consumerCategoryIndex"
    ADD CONSTRAINT "consumerCategoryIndex_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."consumerLTV"
    ADD CONSTRAINT "consumerLTV_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."consumerPortfolioMeasures"
    ADD CONSTRAINT "consumerMetrics_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."consumerPortfolioScores"
    ADD CONSTRAINT "consumerPortfolioScores_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."consumerPortfolioScores"
    ADD CONSTRAINT "consumer_protfolio_scores_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."consumerShopMetrics"
    ADD CONSTRAINT "cosnumerShops_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."consumerShopMetrics"
    ADD CONSTRAINT "cosnumerShops_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_order_fkey" FOREIGN KEY ("order") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."gdprconsumerreq"
    ADD CONSTRAINT "gdprconsumerreq_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."gdprconsumerreq"
    ADD CONSTRAINT "gdprconsumerreq_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."gdprrequests"
    ADD CONSTRAINT "gdprrequests_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."gdprrequests"
    ADD CONSTRAINT "gdprrequests_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_user_fkey" FOREIGN KEY ("user") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_campaigns_fkey" FOREIGN KEY ("campaigns") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_carts_fkey" FOREIGN KEY ("carts") REFERENCES "public"."carts"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_consumers_fkey" FOREIGN KEY ("consumers") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_periods_fkey" FOREIGN KEY ("periods") REFERENCES "public"."periods"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_programs_fkey" FOREIGN KEY ("programs") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_shops_fkey" FOREIGN KEY ("shops") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."orderDiscounts"
    ADD CONSTRAINT "orderDiscounts_discount_fkey" FOREIGN KEY ("discount") REFERENCES "public"."discounts"("id");



ALTER TABLE ONLY "public"."orderDiscounts"
    ADD CONSTRAINT "orderDiscounts_order_fkey" FOREIGN KEY ("order") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_cart_fkey" FOREIGN KEY ("cart") REFERENCES "public"."carts"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_consumer_fkey" FOREIGN KEY ("consumer") REFERENCES "public"."consumers"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_discount_fkey" FOREIGN KEY ("discount") REFERENCES "public"."discounts"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_offer_fkey" FOREIGN KEY ("offer") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_fkey" FOREIGN KEY ("category") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_shops_fkey" FOREIGN KEY ("shops") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."programgoals"
    ADD CONSTRAINT "programgoals_program_fkey" FOREIGN KEY ("program") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_campaigns_fkey" FOREIGN KEY ("campaigns") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."shopBilling"
    ADD CONSTRAINT "shopBilling_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."shopSettings"
    ADD CONSTRAINT "shopSettings_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."shopauth"
    ADD CONSTRAINT "shopauth_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."shopstores"
    ADD CONSTRAINT "shopstores_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_userid_fkey" FOREIGN KEY ("userid") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_products_fkey" FOREIGN KEY ("products") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_shop_fkey" FOREIGN KEY ("shop") REFERENCES "public"."shops"("id");



ALTER TABLE "public"."addressbook" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaignGoals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaignMetrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cartitems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumer12m" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumerCategoryIndex" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumerLTV" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumerPortfolioMeasures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumerPortfolioScores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumerShopMetrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gdprconsumerreq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gdprrequests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offerMetrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orderDiscounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."periods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programMetrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programgoals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopBilling" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopSettings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopauth" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shops" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopstores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."userBilling" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."userProfile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variants" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."consumer_12m_install"() TO "anon";
GRANT ALL ON FUNCTION "public"."consumer_12m_install"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."consumer_12m_install"() TO "service_role";



GRANT ALL ON FUNCTION "public"."consumer_12m_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."consumer_12m_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."consumer_12m_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."consumer_geolocation"("p_shop_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."consumer_geolocation"("p_shop_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."consumer_geolocation"("p_shop_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."dashboard_sales_summary"("p_shop_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."dashboard_sales_summary"("p_shop_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dashboard_sales_summary"("p_shop_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gdpr-consumer-request"() TO "anon";
GRANT ALL ON FUNCTION "public"."gdpr-consumer-request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gdpr-consumer-request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gdpr-shop-redact"("shopid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gdpr-shop-redact"("shopid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gdpr-shop-redact"("shopid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gdprrequest-foreign-keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."gdprrequest-foreign-keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gdprrequest-foreign-keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_enums"("enum_schema" "text", "enum_types" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_enums"("enum_schema" "text", "enum_types" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_enums"("enum_schema" "text", "enum_types" "text"[]) TO "service_role";
























GRANT ALL ON TABLE "public"."addressbook" TO "anon";
GRANT ALL ON TABLE "public"."addressbook" TO "authenticated";
GRANT ALL ON TABLE "public"."addressbook" TO "service_role";



GRANT ALL ON SEQUENCE "public"."address_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."address_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."address_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."billing" TO "anon";
GRANT ALL ON TABLE "public"."billing" TO "authenticated";
GRANT ALL ON TABLE "public"."billing" TO "service_role";



GRANT ALL ON SEQUENCE "public"."billing_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."billing_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."billing_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."campaignGoals" TO "anon";
GRANT ALL ON TABLE "public"."campaignGoals" TO "authenticated";
GRANT ALL ON TABLE "public"."campaignGoals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."campaignGoals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."campaignGoals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."campaignGoals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."campaignMetrics" TO "anon";
GRANT ALL ON TABLE "public"."campaignMetrics" TO "authenticated";
GRANT ALL ON TABLE "public"."campaignMetrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."campaignResults_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."campaignResults_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."campaignResults_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON SEQUENCE "public"."campaigns_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."campaigns_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."campaigns_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cartitems" TO "anon";
GRANT ALL ON TABLE "public"."cartitems" TO "authenticated";
GRANT ALL ON TABLE "public"."cartitems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cartitems_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cartitems_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cartitems_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."carts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."carts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."carts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."consumer12m" TO "anon";
GRANT ALL ON TABLE "public"."consumer12m" TO "authenticated";
GRANT ALL ON TABLE "public"."consumer12m" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consumer12M_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consumer12M_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consumer12M_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."consumerCategoryIndex" TO "anon";
GRANT ALL ON TABLE "public"."consumerCategoryIndex" TO "authenticated";
GRANT ALL ON TABLE "public"."consumerCategoryIndex" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consumerCategoryIndex_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consumerCategoryIndex_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consumerCategoryIndex_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."consumerLTV" TO "anon";
GRANT ALL ON TABLE "public"."consumerLTV" TO "authenticated";
GRANT ALL ON TABLE "public"."consumerLTV" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consumerLTV_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consumerLTV_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consumerLTV_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."consumerPortfolioMeasures" TO "anon";
GRANT ALL ON TABLE "public"."consumerPortfolioMeasures" TO "authenticated";
GRANT ALL ON TABLE "public"."consumerPortfolioMeasures" TO "service_role";



GRANT ALL ON TABLE "public"."consumerPortfolioScores" TO "anon";
GRANT ALL ON TABLE "public"."consumerPortfolioScores" TO "authenticated";
GRANT ALL ON TABLE "public"."consumerPortfolioScores" TO "service_role";



GRANT ALL ON TABLE "public"."consumerShopMetrics" TO "anon";
GRANT ALL ON TABLE "public"."consumerShopMetrics" TO "authenticated";
GRANT ALL ON TABLE "public"."consumerShopMetrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consumer_protfolio_scores_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consumer_protfolio_scores_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consumer_protfolio_scores_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consumermetrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consumermetrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consumermetrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."consumers" TO "anon";
GRANT ALL ON TABLE "public"."consumers" TO "authenticated";
GRANT ALL ON TABLE "public"."consumers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consumers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consumers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consumers_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cosnumerShops_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cosnumerShops_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cosnumerShops_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."discounts" TO "anon";
GRANT ALL ON TABLE "public"."discounts" TO "authenticated";
GRANT ALL ON TABLE "public"."discounts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."discounts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."discounts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."discounts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gdprrequests" TO "anon";
GRANT ALL ON TABLE "public"."gdprrequests" TO "authenticated";
GRANT ALL ON TABLE "public"."gdprrequests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."gdprRequests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."gdprRequests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."gdprRequests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gdprconsumerreq" TO "anon";
GRANT ALL ON TABLE "public"."gdprconsumerreq" TO "authenticated";
GRANT ALL ON TABLE "public"."gdprconsumerreq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."gdprconsumerreq_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."gdprconsumerreq_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."gdprconsumerreq_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."interests" TO "anon";
GRANT ALL ON TABLE "public"."interests" TO "authenticated";
GRANT ALL ON TABLE "public"."interests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_states" TO "anon";
GRANT ALL ON TABLE "public"."oauth_states" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_states" TO "service_role";



GRANT ALL ON SEQUENCE "public"."oauth_states_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."oauth_states_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."oauth_states_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."offerMetrics" TO "anon";
GRANT ALL ON TABLE "public"."offerMetrics" TO "authenticated";
GRANT ALL ON TABLE "public"."offerMetrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."offerMetrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."offerMetrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."offerMetrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."offers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."offers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."offers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orderDiscounts" TO "anon";
GRANT ALL ON TABLE "public"."orderDiscounts" TO "authenticated";
GRANT ALL ON TABLE "public"."orderDiscounts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orderDiscounts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orderDiscounts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orderDiscounts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."periods" TO "anon";
GRANT ALL ON TABLE "public"."periods" TO "authenticated";
GRANT ALL ON TABLE "public"."periods" TO "service_role";



GRANT ALL ON SEQUENCE "public"."periods_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."periods_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."periods_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."plans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."plans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."plans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."programMetrics" TO "anon";
GRANT ALL ON TABLE "public"."programMetrics" TO "authenticated";
GRANT ALL ON TABLE "public"."programMetrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."programMetrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."programMetrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."programMetrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."programgoals" TO "anon";
GRANT ALL ON TABLE "public"."programgoals" TO "authenticated";
GRANT ALL ON TABLE "public"."programgoals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."program_goals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."program_goals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."program_goals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."programs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."programs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."programs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shopBilling" TO "anon";
GRANT ALL ON TABLE "public"."shopBilling" TO "authenticated";
GRANT ALL ON TABLE "public"."shopBilling" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopBilling_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopBilling_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopBilling_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shopSettings" TO "anon";
GRANT ALL ON TABLE "public"."shopSettings" TO "authenticated";
GRANT ALL ON TABLE "public"."shopSettings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopSettings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopSettings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopSettings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shopstores" TO "anon";
GRANT ALL ON TABLE "public"."shopstores" TO "authenticated";
GRANT ALL ON TABLE "public"."shopstores" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopStores_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopStores_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopStores_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shopauth" TO "anon";
GRANT ALL ON TABLE "public"."shopauth" TO "authenticated";
GRANT ALL ON TABLE "public"."shopauth" TO "service_role";



GRANT ALL ON TABLE "public"."shops" TO "anon";
GRANT ALL ON TABLE "public"."shops" TO "authenticated";
GRANT ALL ON TABLE "public"."shops" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shops_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shops_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shops_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."storeleads" TO "anon";
GRANT ALL ON TABLE "public"."storeleads" TO "authenticated";
GRANT ALL ON TABLE "public"."storeleads" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."userBilling" TO "anon";
GRANT ALL ON TABLE "public"."userBilling" TO "authenticated";
GRANT ALL ON TABLE "public"."userBilling" TO "service_role";



GRANT ALL ON SEQUENCE "public"."userBilling_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userBilling_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userBilling_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."userProfile" TO "anon";
GRANT ALL ON TABLE "public"."userProfile" TO "authenticated";
GRANT ALL ON TABLE "public"."userProfile" TO "service_role";



GRANT ALL ON SEQUENCE "public"."userProfile_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userProfile_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userProfile_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."variants" TO "anon";
GRANT ALL ON TABLE "public"."variants" TO "authenticated";
GRANT ALL ON TABLE "public"."variants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
