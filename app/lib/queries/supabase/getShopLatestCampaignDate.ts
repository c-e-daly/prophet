// app/lib/queries/supabase/getShopLatestCampaignDate.ts
import createClient from "../../../../supabase/server";

export async function getShopLatestCampaignDate(
  shopsID: number,
  excludeCampaignId?: number
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_shop_latest_campaign_date', {
    p_shops_id: shopsID,
    p_exclude_campaign_id: excludeCampaignId ?? undefined,
  });

  if (error) {
    console.error('[getShopLatestCampaignDate] Error:', {
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      shopsID,
      excludeCampaignId,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to fetch latest campaign date: ${error.message}`);
  }

  return data as string | null;
}