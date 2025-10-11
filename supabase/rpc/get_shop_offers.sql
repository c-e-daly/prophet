-- ============================================================================
-- fn: get_shop_offers
-- desc: Paginated list of offers for a shop over the last N months.
-- params:
--   p_shops_id     bigint      -- required
--   p_months_back  int         -- default 12
--   p_limit        int         -- default 50
--   p_page         int         -- default 1 (1-based)
--   p_statuses     "offerStatus"[] -- nullable; when null, returns all statuses
-- returns: (rows jsonb, total_count bigint)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_shop_offers(
  p_shops_id     bigint,
  p_months_back  int DEFAULT 12,
  p_limit        int DEFAULT 50,
  p_page         int DEFAULT 1,
  p_statuses     "offerStatus"[] DEFAULT ARRAY['Auto Accepted', 'Accepted Expired', 'Pending Review']::"offerStatus"[]
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
  v_cutoff    timestamptz;
  v_offset    int;
  v_count     bigint;
  v_rows      jsonb;
BEGIN
  IF p_shops_id IS NULL THEN
    RAISE EXCEPTION 'p_shops_id is required';
  END IF;

  v_cutoff := (now() AT TIME ZONE 'utc') - make_interval(months => greatest(p_months_back, 0));
  v_offset := greatest(p_page - 1, 0) * greatest(p_limit, 1);

  -- Get the total count first
  SELECT count(*)::bigint INTO v_count
  FROM offers
  WHERE shops = p_shops_id
    AND "createDate" >= v_cutoff
    AND (p_statuses IS NULL OR "offerStatus" = ANY(p_statuses));

  -- Get the paginated rows
  SELECT coalesce(jsonb_agg(to_jsonb(o.*)), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT *
    FROM offers
    WHERE shops = p_shops_id
      AND "createDate" >= v_cutoff
      AND (p_statuses IS NULL OR "offerStatus" = ANY(p_statuses))
    ORDER BY "createDate" DESC
    OFFSET v_offset
    LIMIT greatest(p_limit, 1)
  ) o;

  -- Return both values
  RETURN QUERY SELECT v_rows, v_count;
END;
$$;