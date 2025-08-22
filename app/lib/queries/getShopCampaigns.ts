// app/lib/queries/getShopCampaigns.ts
import { createClient } from "../../utils/supabase/server";
import type { Campaign, Program } from "../queries/types"; // <- correct path

export async function fetchCampaignsWithPrograms(
  shopId: number
): Promise<Array<Campaign & { programs: Program[] }>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      shop,
      campaign_name,
      campaign_description,
      campaign_start_date,
      campaign_end_date,
      code_prefix,
      budget,
      campaign_goals,
      active,
      created_at,
      updated_at,
      programs:programs!programs_campaign_fkey (
        id,
        campaign,
        program_name,
        type,
        status,
        start_date,
        end_date,
        program_accept_rate,
        program_decline_rate.
        combine_product_discounts,
        combine_shipping_discounts,
        combine_order_discounts,
        expiry_time_minutes,
        code_prefix,
        isDefault,
        program_focus,
        shop
      )
    `)
    .eq("shop", shopId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch campaigns: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    shop: row.shop,
    name: row.campaign_name,
    description: row.campaign_description,
    code_prefix: row.code_prefix,
    budget: row.budget,
    start_date: row.campaign_start_date,
    end_date: row.campaign_end_date,
    status: row.active ? "ACTIVE" : "DRAFT",
    goals: row.campaign_goals ?? undefined,
    created_date: row.created_at,
    modified_date: row.updated_at,
    programs: (row.programs ?? []).map((p: any): Program => ({
      id: p.id,
      campaign: p.campaign,
      name: p.name,
      type: p.type,
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
      program_accept_rate: p.program_accept_rate,
      program_decline_rate: p.program_decline_rate,
      combine_product_discounts: p.combine_product_discounts,
      combine_shipping_discounts: p.combine_shipping_discounts,
      combine_order_discounts: p.combine_order_discounts,
      expiry_time_minutes: p.expiry_time_minutes,
      code_prefix: p.code_prefix,
      isDefault: p.isDefault,
      program_focus: p.program_focus,
      shop: p.shop
    })),
  }));
}
