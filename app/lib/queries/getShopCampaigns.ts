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
      goals,
      status,
      created_at,
      modifiedDate,
      programs:programs!programs_campaign_fkey (
        id,
        campaign,
        programName,
        type,
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

  return data.map((row: any) => ({
    id: row.id,
    shop: row.shop,
    campaignName: row.campaignName,
    description: row.description,
    codePrefix: row.codePrefix,
    budget: row.budget,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    goals: row.campaign_goals ?? undefined,
    created_date: row.created_at,
    modifiedDate: row.modifiedDate,
    isDefault: row.isDefault,
    // Handle case where no programs exist for a campaign
    programs: (row.programs ?? []).map((p: any): Program => ({
      id: p.id,
      campaign: p.campaign,
      programName: p.programName, // Fixed: was p.name, should be p.program_name
      type: p.type,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      acceptRate: p.acceptRate,
      declineRate: p.declineRate,
      combineProductDiscounts: p.combineProductDiscounts,
      combineShippingDiscounts: p.combineShippingDiscounts,
      combineOrderDiscounts: p.combineOrderDiscounts,
      expiryTimeMinutes: p.expiryTimeMinutes,
      codePrefix: p.codePrefix,
      isDefault: p.isDefault,
      programFocus: p.programFocus,
      shop: p.shop
    })),
  }));
}