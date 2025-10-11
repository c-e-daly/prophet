-- =============================================================================
-- fn: get_shop_carts
-- desc: Paginated list of carts for a shop over the last N months.
-- params:
--   p_shops_id     bigint      -- required
--   p_months_back  int         -- default 12
--   p_limit        int         -- default 50
--   p_page         int         -- default 1 (1-based)
--   p_statuses     "cartStatus"[] -- nullable; when null, returns ALL statuses
-- returns: (rows jsonb, total_count bigint)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_shop_carts(
  p_shops_id     bigint,
  p_months_back  int DEFAULT 12,
  p_limit        int DEFAULT 50,
  p_page         int DEFAULT 1,
  p_statuses     "cartStatus"[] DEFAULT NULL  -- Changed to NULL default
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

  -- Get total count
  SELECT count(*)::bigint INTO v_count
  FROM carts
  WHERE shops = p_shops_id
    AND "createDate" >= v_cutoff
    AND (
      p_statuses IS NULL 
      OR "cartStatus" = ANY (p_statuses)
    );

  -- Get page rows
  SELECT coalesce(jsonb_agg(to_jsonb(c.*)), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT *
    FROM carts
    WHERE shops = p_shops_id
      AND "createDate" >= v_cutoff
      AND (
        p_statuses IS NULL 
        OR "cartStatus" = ANY (p_statuses)
      )
    ORDER BY "createDate" DESC, id DESC
    OFFSET v_offset
    LIMIT greatest(p_limit, 1)
  ) c;

  -- Return both values
  RETURN QUERY SELECT v_rows, v_count;
END;
$$;
