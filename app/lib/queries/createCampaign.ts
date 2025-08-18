import {createClient} from "../../utils/supabase/server";

type CampaignGoal = {
  type: string;
  metric: string;
  value: number;
};

type CreateCampaignPayload = {
  campaignName: string;
  campaignDescription: string;
  campaignStartDate: string;
  campaignEndDate: string;
  codePrefix: string;
  budget: number;
  campaignGoals: CampaignGoal[];
  externalId: string;
  active: boolean;
  shop: string;
};

export async function createCampaign(payload: CreateCampaignPayload) {
   const supabase = createClient();
  try {
    // First, get the shop ID from the shops table using the shop domain
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('shop_domain', payload.shop) // Assuming shop_domain is the field name
      .single();

    if (shopError) {
      throw new Error(`Failed to find shop: ${shopError.message}`);
    }

    if (!shopData) {
      throw new Error(`Shop not found: ${payload.shop}`);
    }

    // Insert the campaign with the shop ID reference
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        campaign_name: payload.campaignName,
        campaign_description: payload.campaignDescription,
        campaign_start_date: payload.campaignStartDate,
        campaign_end_date: payload.campaignEndDate,
        code_prefix: payload.codePrefix,
        budget: payload.budget,
        campaign_goals: payload.campaignGoals, // Stored as JSONB
        external_id: payload.externalId,
        active: payload.active,
        shop: shopData.id, // Reference to shops.id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`);
    }

    return campaignData;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}