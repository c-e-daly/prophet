// app/lib/queries/getCampaignForEdit.ts
import createClient from "../../../../supabase/server";
import type { Database } from "../../../../supabase/database.types";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type CampaignRow = Tables<"campaigns">;
type ProgramRow = Tables<"programs">;
type ProgramSummary = {
  id: number;
  name: string | null;
  status: ProgramRow["status"];
  startDate: string | null;
  endDate: string | null;
  focus: ProgramRow["focus"];
};

type RawProgram = {
  id: number;
  name: string | null;
  status: ProgramRow["status"] | null;
  startDate: string | null;
  endDate: string | null;
  shops: number | null;
  focus: ProgramRow["focus"] | null;
};

type RawCampaign = {
  id: number;
  shops: number;
  budget: number | null;
  name: string | null;
  description: string | null;
  codePrefix: string | null;
  startDate: string | null;
  endDate: string | null;
  goals: CampaignRow["goals"];
  status: CampaignRow["status"] | null;
  createDate: string;
  modifiedDate: string;
  programs?: RawProgram[];
};

function mapProgram(raw: RawProgram): ProgramSummary {
  return {
    id: raw.id,
    name: raw.name ?? null,
    status: (raw.status ?? "Draft") as ProgramRow["status"],
    startDate: raw.startDate,
    endDate: raw.endDate,
    focus: raw.focus,
  };
}

function mapCampaign(raw: RawCampaign): CampaignRow {
  return {
    id: raw.id,
    shops: raw.shops,
    budget: raw.budget,
    name: raw.name,
    description: raw.description ?? null,
    codePrefix: raw.codePrefix ?? null,
    startDate: raw.startDate,
    endDate: raw.endDate,
    goals: raw.goals ?? [],
    status: (raw.status ?? "Draft") as CampaignRow["status"],
    createDate: raw.createDate,
    modifiedDate: raw.modifiedDate,
  } as CampaignRow;
}

export async function getCampaignForEdit(shopsID: number, campaignsID: number): Promise<{
  campaign: CampaignRow;
  programs: ProgramSummary[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      shops,
      budget,
      campaignName,
      description,
      codePrefix,
      startDate,
      endDate,
      campaignGoals,
      status,
      createDate,
      modifiedDate,
      programs (
        id,
        name,
        status,
        startDate,
        endDate,
        focus,
        shops
      )
    `
    )
    .eq("shops", shopsID)
    .eq("id", campaignsID)
    .single<RawCampaign>();

  if (error || !data) throw new Error("campaign_not_found");

  const campaign = mapCampaign(data);
  const programs = (data.programs ?? []).map(mapProgram);

  return { campaign, programs };
}
