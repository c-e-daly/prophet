// app/lib/queries/createShopCampaign.ts
import { createClient } from "../../utils/supabase/server";

type CampaignGoal = { type: string; metric: string; value: number };

type CreateCampaignPayload = {
  campaignName: string;
  campaignDescription: string;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  codePrefix: string;
  budget: number; // stored directly in `budget` per your schema
  campaignGoals: CampaignGoal[]; // jsonb
  externalId: string;
  active: boolean;
  shop: string; // shop domain (e.g., my-shop.myshopify.com)
};

export async function createCampaign(payload: CreateCampaignPayload) {
  const supabase = createClient();

  // 1) Resolve shop.id by store_url
  const { data: shopData, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", payload.shop) // <-- fixed from 'shop_domain'
    .single();

  if (shopError || !shopData) {
    throw new Error(`Failed to find shop ${payload.shop}: ${shopError?.message || "not found"}`);
  }

  // 2) Insert campaign
  const { data: campaignData, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      campaign_name: payload.campaignName,
      campaign_description: payload.campaignDescription,
      campaign_start_date: payload.campaignStartDate,
      campaign_end_date: payload.campaignEndDate,
      code_prefix: payload.codePrefix,
      budget: payload.budget,                 // <- number (not cents) per your schema
      campaign_goals: payload.campaignGoals,  // <- jsonb
      external_id: payload.externalId,
      active: payload.active,
      shop: shopData.id,                      // FK to shops.id
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (campaignError) {
    throw new Error(`Failed to create campaign: ${campaignError.message}`);
  }

  return campaignData;
}
