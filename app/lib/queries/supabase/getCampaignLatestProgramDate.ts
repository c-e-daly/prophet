// app/lib/queries/supabase/getCampaignLatestProgramDate.ts
import createClient from "../../../../supabase/server";

export async function getCampaignLatestProgramDate(
  shopsID: number,
  campaignId: number,
  excludeProgramId?: number
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_campaign_latest_program_date', {
    p_shops_id: shopsID,
    p_campaigns_id: campaignId,
    p_exclude_program_id: excludeProgramId ?? undefined,
  });

  if (error) {
    console.error('[getCampaignLatestProgramDate] Error:', {
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      shopsID,
      campaignId,
      excludeProgramId,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to fetch latest program date: ${error.message}`);
  }

  return data as string | null;
}