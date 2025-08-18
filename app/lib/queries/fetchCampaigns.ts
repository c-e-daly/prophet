import { createClient } from "../../utils/supabase/server";

type FetchCampaignsParams = {
  shopId?: number;
  shopDomain?: string;
  active?: boolean;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  campaignIds?: number[];
};

export async function fetchCampaigns(params: FetchCampaignsParams = {}) {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('campaigns')
      .select(`
        id,
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
        shop,
        shops!inner(
          id,
          shop_domain
        )
      `);

    // Filter by shop ID if provided
    if (params.shopId) {
      query = query.eq('shop', params.shopId);
    }

    // Filter by shop domain if provided (alternative to shopId)
    if (params.shopDomain && !params.shopId) {
      query = query.eq('shops.shop_domain', params.shopDomain);
    }

    // Filter by active status
    if (params.active !== undefined) {
      query = query.eq('active', params.active);
    }

    // Filter by specific campaign IDs
    if (params.campaignIds && params.campaignIds.length > 0) {
      query = query.in('id', params.campaignIds);
    }

    // Filter by date range (campaign start date)
    if (params.dateRange?.startDate) {
      query = query.gte('campaign_start_date', params.dateRange.startDate);
    }

    if (params.dateRange?.endDate) {
      query = query.lte('campaign_end_date', params.dateRange.endDate);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

// Simplified version for just fetching by shop domain (most common use case)
export async function fetchCampaignsByShop(shopDomain: string) {
  return fetchCampaigns({ 
    shopDomain, 
    active: true 
  });
}

// Fetch a single campaign by external ID
export async function fetchCampaignByExternalId(externalId: string, shopDomain: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        shops!inner(
          id,
          shop_domain
        )
      `)
      .eq('external_id', externalId)
      .eq('shops.shop_domain', shopDomain)
      .single();

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching campaign by external ID:', error);
    throw error;
  }
}