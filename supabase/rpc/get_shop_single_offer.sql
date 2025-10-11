CREATE OR REPLACE FUNCTION get_shop_single_offer(
  p_shops_id bigint,
  p_offers_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_offer            offers%ROWTYPE;
  v_cart             carts%ROWTYPE;
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
  IF p_offers_id IS NULL OR p_offers_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing offer id.';
  END IF;

  -- Get the offer (single row, use SELECT INTO)
  SELECT * INTO v_offer
  FROM offers
  WHERE id = p_offers_id
    AND shops = p_shops_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'offers', null,
      'carts', null,
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

  -- Get cart
  IF v_offer.carts IS NOT NULL THEN
    SELECT * INTO v_cart
    FROM carts
    WHERE id = v_offer.carts;
  END IF;

  -- Get consumer
  IF v_offer.consumers IS NOT NULL THEN
    SELECT * INTO v_consumer
    FROM consumers
    WHERE id = v_offer.consumers;
  END IF;

  -- Get program
  IF v_offer.programs IS NOT NULL THEN
    SELECT * INTO v_program
    FROM programs
    WHERE id = v_offer.programs;
  END IF;

  -- Get campaign
  IF v_offer.campaigns IS NOT NULL THEN
    SELECT * INTO v_campaign
    FROM campaigns
    WHERE id = v_offer.campaigns;
  END IF;

  -- Get counter offers (multiple rows, use jsonb_agg)
  SELECT COALESCE(jsonb_agg(to_jsonb(co.*) ORDER BY co."createDate" DESC), '[]'::jsonb)
  INTO v_counter_offers
  FROM "counterOffers" co
  WHERE co.offers = p_offers_id
    AND co.shops = p_shops_id;

  -- Get cart items with variant pricing (multiple rows)
  IF v_offer.carts IS NOT NULL THEN
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
    WHERE ci.carts = v_offer.carts
      AND ci.shops = p_shops_id;
  END IF;

  -- Get consumer portfolio analytics
  IF v_offer.consumers IS NOT NULL THEN
    -- consumerShop12M (view)
    SELECT * INTO v_consumer_shop_12m
    FROM "consumerShop12m"
    WHERE consumers = v_offer.consumers
      AND shops = p_shops_id;
    v_has_consumer_12m := FOUND;

    -- consumerShopCPM
    SELECT * INTO v_consumer_shop_cpm
    FROM "consumerShopCPM"
    WHERE consumers = v_offer.consumers
      AND shops = p_shops_id;
    v_has_consumer_cpm := FOUND;

    -- consumerShopCPMS
    SELECT * INTO v_consumer_shop_cpms
    FROM "consumerShopCPMS"
    WHERE consumers = v_offer.consumers
      AND shops = p_shops_id;
    v_has_consumer_cpms := FOUND;

    -- consumerShopLTV
    SELECT * INTO v_consumer_shop_ltv
    FROM "consumerShopLTV"
    WHERE consumers = v_offer.consumers
      AND shops = p_shops_id;
    v_has_consumer_ltv := FOUND;
  END IF;

  -- Return everything (convert to JSONB only at the end)
  RETURN jsonb_build_object(
    'offers', to_jsonb(v_offer),
    'carts', CASE WHEN v_cart.id IS NOT NULL THEN to_jsonb(v_cart) ELSE NULL END,
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