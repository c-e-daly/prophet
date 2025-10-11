-- =============================================================================
-- fn: get_shop_counter_offers
-- desc: Returns counter offers for a shop, including related offer info.
-- params:
--   p_shops_id   bigint  -- required
--   p_months_back int default 12
--   p_limit       int default 50
--   p_page        int default 1
--   p_statuses    "offerStatus"[] -- uses same enum as offers
-- returns: TABLE(rows jsonb, total_count bigint)
-- folders: /rpc/counter_offers/get_shop_counter_offers.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_counter_offers(
  p_shops_id   bigint,
  p_months_back int DEFAULT 12,
  p_limit       int DEFAULT 50,
  p_page        int DEFAULT 1,
  p_statuses    "offerStatus"[] DEFAULT ARRAY[
    'Reviewed Countered',
    'Consumer Accepted',
    'Consumer Declined',
    'Counter Accepted Expired',
    'Countered Withdrawn',
    'Requires Approval',
    'Consumer Countered',
    'Declined Consumer Counter',
    'Accepted Consumer Counter'
  ]::"offerStatus"[]  -- ← Cast to enum type
)
RETURNS TABLE (
  rows         jsonb,
  total_count  bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_since  timestamptz;
  v_count  bigint;
  v_rows   jsonb;
BEGIN
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  v_offset := greatest((p_page - 1) * p_limit, 0);
  v_since := (now() AT TIME ZONE 'utc') - make_interval(months => greatest(p_months_back, 0));

  -- Get total count
  SELECT count(*)::bigint INTO v_count
  FROM "counterOffers" co
  WHERE co.shops = p_shops_id
    AND co."createDate" >= v_since
    AND (p_statuses IS NULL OR co."offerStatus" = ANY(p_statuses));
    -- ↑ No quotes needed now that p_statuses is properly typed

  -- Get paginated rows with joined offer data
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', result.id,
      'shops', result.shops,
      'offers', result.offers,
      'counterType', result."counterType",
      'counterConfig', result."counterConfig",
      'totalDiscountCents', result."totalDiscountCents",
      'counterOfferPrice', result."counterOfferPrice",
      'status', result."offerStatus",
      'predictedAcceptanceProbability', result."predictedAcceptanceProbability",
      'expectedValueScore', result."expectedValueScore",
      'createDate', result."createDate",
      'consumerEmail', result."consumerEmail",
      'consumerName', result."consumerName",
      'cartTotalPrice', result."cartTotalPrice"
    )
  ), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT 
      co.id,
      co.shops,
      co.offers,
      co."counterType",
      co."counterConfig",
      co."totalDiscountCents",
      co."counterOfferPrice",
      co."offerStatus",
      co."predictedAcceptanceProbability",
      co."expectedValueScore",
      co."createDate",
      o."consumerEmail",
      o."consumerName",
      o."cartTotalPrice"
    FROM "counterOffers" co
    JOIN offers o ON o.id = co.offers
    WHERE co.shops = p_shops_id
      AND co."createDate" >= v_since
      AND (p_statuses IS NULL OR co."offerStatus" = ANY(p_statuses))
    ORDER BY co."createDate" DESC
    OFFSET v_offset
    LIMIT p_limit
  ) result;

  -- Return both values
  RETURN QUERY SELECT v_rows, v_count;
END;
$$;