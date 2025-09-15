// app/lib/queries/getShopCampaigns.ts
import  createClient  from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

type Campaign = Tables<"campaigns">;
type Program  = Tables<"programs">;

export type CampaignWithPrograms = Campaign & { programs: Program[] };

export async function fetchCampaignsWithPrograms(
  shopId: number
): Promise<CampaignWithPrograms[]> {
  const supabase = createClient();

  // Try single nested query first (requires FK from programs.campaign -> campaigns.id)
  const tryNested = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      // Select ALL campaign cols + ALL program cols so the shape matches the types
      .select(`*, programs(*)`)
      .eq("shops", shopId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as CampaignWithPrograms[];
  };

  // Fallback that doesn't rely on the schema cache
  const fallbackTwoQuery = async () => {
    const { data: campaigns, error: campErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("shops", shopId)
      .order("created_at", { ascending: false });

    if (campErr) throw new Error(`Failed to fetch campaigns: ${campErr.message}`);
    if (!campaigns?.length) return [];

    const ids = campaigns.map(c => c.id);
    const { data: programs, error: progErr } = await supabase
      .from("programs")
      .select("*")
      .eq("shops", shopId)
      .in("campaign", ids);

    if (progErr) throw new Error(`Failed to fetch programs: ${progErr.message}`);

    const byCampaign = new Map<number, Program[]>();
    (programs ?? []).forEach(p => {
      if (p.campaigns == null) return;
      (byCampaign.get(p.campaigns) ?? byCampaign.set(p.campaigns, []).get(p.campaigns)!)?.push(p);
    });

    return (campaigns as Campaign[]).map(c => ({
      ...c,
      programs: byCampaign.get(c.id) ?? [],
    }));
  };

  try {
    return await tryNested();
  } catch (e: any) {
    if (String(e?.message || e).includes("Could not find a relationship")) {
      return await fallbackTwoQuery();
    }
    throw new Error(`Failed to fetch campaigns: ${e?.message ?? e}`);
  }
}
