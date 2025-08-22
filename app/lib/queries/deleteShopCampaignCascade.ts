// app/lib/queries/deleteShopCampaignCascade.ts
import { createClient } from "../../utils/supabase/server";

export async function deleteShopCampaignCascade(
  shopDomain: string,
  campaignId: number,
  opts: { blockActive?: boolean; blockIfHasActivity?: boolean } = { blockActive: true, blockIfHasActivity: true }
) {
  const supabase = createClient();

  // Resolve shop.id
  const { data: shopRow, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("shopDomain", shopDomain)
    .single();
  if (shopErr || !shopRow) throw new Error("shop_not_found");

  // Fetch campaign status
  const { data: camp, error: cErr } = await supabase
    .from("campaigns")
    .select("id, active") // if you also store a 'status', select it here
    .eq("shop", shopRow.id)
    .eq("id", campaignId)
    .single();
  if (cErr || !camp) throw new Error("campaign_not_found");

  if (opts.blockActive && camp.active) {
    throw new Error("campaign_active_block");
  }

  if (opts.blockIfHasActivity) {
    // Example heuristic: any offers exist via programs
    const { data: progs } = await supabase
      .from("programs")
      .select("id")
      .eq("shop", shopRow.id)
      .eq("campaign", campaignId);

    const programIds = (progs ?? []).map((p) => p.id);
    if (programIds.length) {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("shop", shopRow.id)
        .in("program", programIds);
      if ((count ?? 0) > 0) throw new Error("campaign_has_activity");
    }
  }

  // Delete children then parent (or rely on FK CASCADE)
  await supabase.from("programs").delete().eq("shop", shopRow.id).eq("campaign", campaignId);
  await supabase.from("campaigns").delete().eq("shop", shopRow.id).eq("id", campaignId);
}
