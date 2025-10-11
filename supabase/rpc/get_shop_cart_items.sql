-- =============================================================================
-- fn: get_shop_cart_items
-- desc: Returns a single cart with related data - simple row fetching
-- params:
--   p_shops_id bigint  -- required
--   p_carts_id bigint  -- required
-- returns: jsonb { cart: {...}, consumer: {...}, offer: {...}, items: [...], programs: {...} }
-- =============================================================================
CREATE OR REPLACE FUNCTION get_shop_cart_items(
  p_shops_id bigint,
  p_carts_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cart jsonb;
  v_consumer jsonb;
  v_offer jsonb;
  v_program jsonb;
  v_items jsonb;
  v_consumer_id bigint;
  v_program_id bigint;
BEGIN
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;
  IF p_carts_id IS NULL OR p_carts_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing cart id.';
  END IF;

  -- Get cart
  SELECT to_jsonb(c.*) INTO v_cart
  FROM carts c
  WHERE c.id = p_carts_id
    AND c.shops = p_shops_id;

  IF v_cart IS NULL THEN
    RETURN jsonb_build_object(
      'cart', null,
      'consumer', null,
      'offer', null,
      'program', null,
      'items', '[]'::jsonb
    );
  END IF;

  -- Extract consumer ID
  v_consumer_id := (v_cart->>'consumers')::bigint;

  -- Get consumer
  IF v_consumer_id IS NOT NULL THEN
    SELECT to_jsonb(con.*) INTO v_consumer
    FROM consumers con
    WHERE con.id = v_consumer_id;
  END IF;

  -- Get most recent offer
  SELECT to_jsonb(o.*) INTO v_offer
  FROM offers o
  WHERE o.carts = p_carts_id
    AND o.shops = p_shops_id
  ORDER BY o.created_at DESC
  LIMIT 1;

  -- Get program if offer exists
  IF v_offer IS NOT NULL THEN
    v_program_id := (v_offer->>'programs')::bigint;
    IF v_program_id IS NOT NULL THEN
      SELECT to_jsonb(p.*) INTO v_program
      FROM programs p
      WHERE p.id = v_program_id;
    END IF;
  END IF;

  -- Get cart items with variant pricing
  SELECT jsonb_agg(
    jsonb_build_object(
      'cartItem', to_jsonb(ci.*),
      'variantPricing', to_jsonb(vp.*)
    ) ORDER BY ci."createDate" DESC
  ) INTO v_items
  FROM cartitems ci
  LEFT JOIN "variantPricing" vp 
    ON vp."variantID" = ci."variantID" 
    AND vp.shops = ci.shops
  WHERE ci.shops = p_shops_id
    AND ci.carts = p_carts_id;

  -- Return everything
  RETURN jsonb_build_object(
    'cart', COALESCE(v_cart, 'null'::jsonb),
    'consumer', COALESCE(v_consumer, 'null'::jsonb),
    'offer', COALESCE(v_offer, 'null'::jsonb),
    'program', COALESCE(v_program, 'null'::jsonb),
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;