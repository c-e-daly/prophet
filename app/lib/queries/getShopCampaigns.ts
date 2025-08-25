// app/lib/queries/getShopCampaigns.ts
import { createClient } from "../../utils/supabase/server";
import type { Tables } from "./types/dbTables";

// DB-driven types
type Campaign = Tables<"campaigns">;
type Program  = Tables<"programs">;

// Nested return shape from the join
export type CampaignWithPrograms = Campaign & { programs: Program[] };

export async function fetchCampaignsWithPrograms(
  shopId: number
): Promise<CampaignWithPrograms[]> {
  const supabase = createClient();

  // NOTE: keep these column names exactly as they exist in your DB (camelCase in your case).
  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      shop,
      campaignName,
      description,
      startDate,
      endDate,
      codePrefix,
      budget,
      campaignGoals,
      status,
      created_at,
      modifiedDate,
      programs:programs!programs_campaign_fkey (
        id,
        shop,
        campaign,
        programName,
        status,
        startDate,
        endDate,
        acceptRate,
        declineRate,
        combineProductDiscounts,
        combineShippingDiscounts,
        combineOrderDiscounts,
        expiryTimeMinutes,
        codePrefix,
        isDefault,
        programFocus
      )
    `)
    .eq("shop", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  // Supabase returns `any` for nested selects; assert to our typed shape
  const rows = (data ?? []) as CampaignWithPrograms[];
  return rows;
}
