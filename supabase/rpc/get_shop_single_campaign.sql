-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;
-- =============================================================================
-- fn: get_shop_single_campaign
-- desc: Returns a single campaign with all its child programs.
--       Used for edit/detail views.
-- params:
--   p_shops_id     bigint  -- required
--   p_campaigns_id bigint  -- required
-- returns: jsonb { campaign: {...}, programs: [...] }
-- folders: /rpc/campaigns/get_shop_single_campaign.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION get_shop_single_campaign(
  p_shops_id     bigint,
  p_campaigns_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_campaign   campaigns%rowtype;
  v_programs   jsonb;
BEGIN
  -- Validate inputs
  IF p_shops_id IS NULL OR p_shops_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing shop id.';
  END IF;

  IF p_campaigns_id IS NULL OR p_campaigns_id <= 0 THEN
    RAISE EXCEPTION 'Invalid or missing campaign id.';
  END IF;

  -- 1️⃣ Fetch the campaign
  SELECT *
  INTO v_campaign
  FROM campaigns
  WHERE shops = p_shops_id
    AND id = p_campaigns_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found';
  END IF;

  -- 2️⃣ Fetch all programs for this campaign
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(p.*)
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM programs p
  WHERE p.shops = p_shops_id
    AND p.campaigns = p_campaigns_id;

  -- 3️⃣ Return unified result
  RETURN jsonb_build_object(
    'campaign', to_jsonb(v_campaign),
    'programs', v_programs
  );
END;
$$;