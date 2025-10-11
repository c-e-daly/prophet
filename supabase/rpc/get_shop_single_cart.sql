-- =============================================================================
-- fn: get_shop_single_cart
-- desc: Returns a single cart with all related data (offer may be null for abandoned carts)
-- params:
--   p_shops_id bigint  -- required
--   p_carts_id bigint  -- required
-- returns: jsonb { cart, offer, consumer, campaign, program, items, etc }
-- =============================================================================
CREATE OR REPLACE FUNCTION get_shop_single_cart(
  p_shops_id bigint,
  p_carts_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cart             carts%ROWTYPE;
  v_offer            offers%ROWTYPE;
  v_consumer         consumers%ROWTYPE;
  v_program          programs%ROWTYPE;
  v_campaign         campaigns%ROWTYPE;
  v_counter_offers   jsonb := '[]'::jsonb;
  v_cart_items       jsonb := '[]'::jsonb;
  v_consumer_shop_12m    "consumerShop12m"%ROWTYPE;
  v_consumer_shop_cpm    "consumerShopCPM"%ROWTYPE;
  v_consumer_shop_cpms   "consumerShopCPMS"%ROWTYPE;
  v_consumer_shop_ltv    "consumerShopLTV"%ROWTYPE;
  v_has_consumer_12m     boolean := false;
  v_has_consumer_cpm     boolean := false;
  v_has_consumer_cpms    boolean := false;
  v_has_consumer_ltv     boolean := false;
BEGIN
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;
  IF p_carts_id IS NULL OR p_carts_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing cart id.';
  END IF;

  -- Get the cart (single row, use SELECT INTO)
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_carts_id
    AND shops = p_shops_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'carts', null,
      'offers', null,
      'consumers', null,
      'programs', null,
      'campaigns', null,
      'counterOffers', '[]'::jsonb,
      'cartItems', '[]'::jsonb,
      'consumerShop12M', null,
      'consumerShopCPM', null,
      'consumerShopCPMS', null,
      'consumerShopLTV', null
    );
  END IF;

  -- Get offer (if one exists - may be null for abandoned carts)
  SELECT * INTO v_offer
  FROM offers
  WHERE carts = p_carts_id
    AND shops = p_shops_id
  ORDER BY "createDate" DESC
  LIMIT 1;

  -- Get consumer
  IF v_cart.consumers IS NOT NULL THEN
    SELECT * INTO v_consumer
    FROM consumers
    WHERE id = v_cart.consumers;
  END IF;

  -- Get program (if offer exists)
  IF v_offer.programs IS NOT NULL THEN
    SELECT * INTO v_program
    FROM programs
    WHERE id = v_offer.programs;
  END IF;

  -- Get campaign (if offer exists)
  IF v_offer.campaigns IS NOT NULL THEN
    SELECT * INTO v_campaign
    FROM campaigns
    WHERE id = v_offer.campaigns;
  END IF;

  -- Get counter offers (if offer exists)
  IF v_offer.id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(co.*) ORDER BY co."createDate" DESC), '[]'::jsonb)
    INTO v_counter_offers
    FROM "counterOffers" co
    WHERE co.offers = v_offer.id
      AND co.shops = p_shops_id;
  END IF;

  -- Get cart items with variant pricing
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'cartItem', to_jsonb(ci.*),
        'variantPricing', to_jsonb(vp.*)
      ) ORDER BY ci."createDate" DESC
    ), 
    '[]'::jsonb
  ) INTO v_cart_items
  FROM cartitems ci
  LEFT JOIN "variantPricing" vp 
    ON vp."variantID" = ci."variantID" 
    AND vp.shops = ci.shops
  WHERE ci.carts = p_carts_id
    AND ci.shops = p_shops_id;

  -- Get consumer portfolio analytics
  IF v_cart.consumers IS NOT NULL THEN
    -- consumerShop12M (view)
    SELECT * INTO v_consumer_shop_12m
    FROM "consumerShop12m"
    WHERE consumers = v_cart.consumers
      AND shops = p_shops_id;
    v_has_consumer_12m := FOUND;

    -- consumerShopCPM
    SELECT * INTO v_consumer_shop_cpm
    FROM "consumerShopCPM"
    WHERE consumers = v_cart.consumers
      AND shops = p_shops_id;
    v_has_consumer_cpm := FOUND;

    -- consumerShopCPMS
    SELECT * INTO v_consumer_shop_cpms
    FROM "consumerShopCPMS"
    WHERE consumers = v_cart.consumers
      AND shops = p_shops_id;
    v_has_consumer_cpms := FOUND;

    -- consumerShopLTV
    SELECT * INTO v_consumer_shop_ltv
    FROM "consumerShopLTV"
    WHERE consumers = v_cart.consumers
      AND shops = p_shops_id;
    v_has_consumer_ltv := FOUND;
  END IF;

  -- Return everything (same structure as get_shop_single_offer)
  RETURN jsonb_build_object(
    'carts', to_jsonb(v_cart),
    'offers', CASE WHEN v_offer.id IS NOT NULL THEN to_jsonb(v_offer) ELSE NULL END,
    'consumers', CASE WHEN v_consumer.id IS NOT NULL THEN to_jsonb(v_consumer) ELSE NULL END,
    'programs', CASE WHEN v_program.id IS NOT NULL THEN to_jsonb(v_program) ELSE NULL END,
    'campaigns', CASE WHEN v_campaign.id IS NOT NULL THEN to_jsonb(v_campaign) ELSE NULL END,
    'counterOffers', v_counter_offers,
    'cartItems', v_cart_items,
    'consumerShop12M', CASE WHEN v_has_consumer_12m THEN to_jsonb(v_consumer_shop_12m) ELSE NULL END,
    'consumerShopCPM', CASE WHEN v_has_consumer_cpm THEN to_jsonb(v_consumer_shop_cpm) ELSE NULL END,
    'consumerShopCPMS', CASE WHEN v_has_consumer_cpms THEN to_jsonb(v_consumer_shop_cpms) ELSE NULL END,
    'consumerShopLTV', CASE WHEN v_has_consumer_ltv THEN to_jsonb(v_consumer_shop_ltv) ELSE NULL END
  );
END;
$$;