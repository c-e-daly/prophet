// app/lib/queries/getShopCampaigns.ts
import { createClient } from "../../utils/supabase/server";
import type { Campaign, Program } from "../queries/types"; 

export async function fetchCampaignsWithPrograms(
  shopId: number
): Promise<Array<Campaign & { programs: Program[] }>> {
  const supabase = createClient();

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
        programFocus,
        shop
      )
    `)
    .eq("shop", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  // Handle case where no campaigns exist
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: any): Campaign & { programs: Program[] } => ({
    id: row.id,
    shop: row.shop,
    campaignName: row.campaignName,
    description: row.description,
    codePrefix: row.codePrefix,
    budget: row.budget,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status ?? "Draft",
    campaignGoals: row.campaignGoals ?? undefined,
    created_date: row.created_at,
    modifiedDate: row.modifiedDate,
    isDefault: false,
    
    programs: (row.programs ?? []).map((p: any): Program => ({
      id: p.id,
      shop: p.shop,
      campaign: p.campaign,
      programName: p.programName,
      type: null, // Set to null since column doesn't exist
      status: p.status ?? "DRAFT",
      startDate: p.startDate,
      endDate: p.endDate,
      acceptRate: p.acceptRate,
      declineRate: p.declineRate,
      combineProductDiscounts: p.combineProductDiscounts ?? false,
      combineShippingDiscounts: p.combineShippingDiscounts ?? false,
      combineOrderDiscounts: p.combineOrderDiscounts ?? false,
      expiryTimeMinutes: p.expiryTimeMinutes,
      codePrefix: p.codePrefix,
      isDefault: p.isDefault ?? false,
      programFocus: p.programFocus,
    })),
  }));
}