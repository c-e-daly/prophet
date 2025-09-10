// app/lib/queries/deleteShopCampaign.ts
import createClient from "../../../utils/supabase/server";

/**
 * Deletes all programs under campaign, then deletes campaign.
 * Multi-tenant safe: requires shopsId + campaignId.
 */
export async function deleteShopCampaignById(
  shopsId: number,
  campaignId: number
) {
  const supabase = createClient();

  const { error: progErr } = await supabase
    .from("programs")
    .delete()
    .eq("campaigns", campaignId)
    .eq("shops", shopsId);

  if (progErr) throw new Error(`failed_delete_programs:${progErr.message}`);

  const { error: campErr } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("shop", shopsId);

  if (campErr) throw new Error(`failed_delete_campaign:${campErr.message}`);
}