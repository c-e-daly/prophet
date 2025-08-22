import { createClient } from "../../utils/supabase/server";
import type { Campaign, Program } from "../queries/types";

export async function fetchCampaignsWithPrograms(shopId: number): Promise<(Campaign & { programs: Program[] })[]> {
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
      external_id,
      active,
      created_at,
      updated_at,
      programs (
        id,
        shop,
        campaign,
        name,
        type,
        status,
        start_date,
        end_date
      )
    `)
    .eq("shop", shopId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch campaigns: ${error.message}`);

  // Transform DB field names → your types
  return (data || []).map(row => ({
    id: row.id,
    shop: row.shop,
    name: row.campaign_name,
    description: row.campaign_description,
    code_prefix: row.code_prefix,
    budget_cents: row.budget,
    start_date: row.campaign_start_date,
    end_date: row.campaign_end_date,
    status: row.active ? "ACTIVE" : "DRAFT",
    goals: row.campaign_goals,
    created_date: row.created_at,
    modified_date: row.updated_at,
    programs: (row.programs || []).map((p: any) => ({
      id: p.id,
      shop: p.shop,
      campaign: p.campaign,
      name: p.name,
      type: p.type,
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
    })),
  }));
}
