-- =============================================================================
-- fn: upsert_shop_campaigns
-- desc: Insert or update a campaign for a shop.
--       - If p_campaign_id is provided: UPDATE that specific campaign
--       - If p_campaign_id is NULL: INSERT new campaign
-- params:
--   p_shops_id      bigint      -- required
--   p_campaign_id   bigint      -- nullable (if provided, updates; if null, inserts)
--   p_name          text        -- required
--   p_description   text        -- nullable
--   p_code_prefix   text        -- nullable
--   p_budget        numeric     -- nullable (defaults 0)
--   p_start_date    timestamptz -- nullable
--   p_end_date      timestamptz -- nullable
--   p_status        "campaignStatus" -- nullable (defaults 'Draft')
--   p_goals         jsonb       -- nullable
--   p_is_default    boolean     -- defaults false
-- returns: campaigns (single row)
-- folders: /rpc/campaigns/upsert_shop_campaigns.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION upsert_shop_campaigns(
  p_shops_id      bigint,
  p_campaign_id   bigint DEFAULT NULL,
  p_name          text DEFAULT NULL,     -- FIXED: Must have DEFAULT after p_campaign_id
  p_description   text DEFAULT NULL,
  p_code_prefix   text DEFAULT NULL,
  p_budget        numeric DEFAULT 0,
  p_start_date    timestamptz DEFAULT NULL,
  p_end_date      timestamptz DEFAULT NULL,
  p_status        "campaignStatus" DEFAULT 'Draft',
  p_goals         jsonb DEFAULT '[]'::jsonb,
  p_is_default    boolean DEFAULT false
)
RETURNS campaigns
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_result campaigns;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'p_shops_id is required and must be positive';
  END IF;

  IF COALESCE(TRIM(p_name), '') = '' THEN
    RAISE EXCEPTION 'p_name cannot be blank';
  END IF;

  -- CASE 1: UPDATE existing campaign by ID
  IF p_campaign_id IS NOT NULL THEN
    UPDATE campaigns
    SET
      name         = COALESCE(TRIM(p_name), name),
      description  = COALESCE(TRIM(p_description), description),
      codePrefix   = COALESCE(TRIM(p_code_prefix), codePrefix),
      budget       = COALESCE(p_budget, budget),
      startDate    = COALESCE(p_start_date, startDate),
      endDate      = COALESCE(p_end_date, endDate),
      status       = COALESCE(p_status, status),
      goals        = COALESCE(p_goals, goals),
      isDefault    = COALESCE(p_is_default, isDefault),
      modifiedDate = v_now
    WHERE id = p_campaign_id
      AND shops = p_shops_id  -- Security: ensure shop ownership
    RETURNING * INTO v_result;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'campaign_not_found: No campaign with id % for shop %', p_campaign_id, p_shops_id;
    END IF;

    RETURN v_result;
  ELSE
    -- CASE 2: INSERT new campaign
    INSERT INTO campaigns (
      shops, name, description, codePrefix, budget,
      startDate, endDate, status, goals,
      isDefault, createDate, modifiedDate
    )
    VALUES (
      p_shops_id,
      TRIM(p_name),
      COALESCE(TRIM(p_description), ''),
      COALESCE(TRIM(p_code_prefix), ''),
      COALESCE(p_budget, 0),
      p_start_date,
      p_end_date,
      COALESCE(p_status, 'Draft'),
      COALESCE(p_goals, '[]'::jsonb),
      COALESCE(p_is_default, false),
      v_now,
      v_now
    )
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;
END;
$$;