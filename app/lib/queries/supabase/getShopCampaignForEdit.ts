// app/lib/queries/getCampaignForEdit.ts
import  createClient  from "../../../../supabase/server";
import type { Database } from "../../../../supabase/database.types";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type CampaignRow = Tables<"campaigns">;
type ProgramRow = Tables<"programs">;

type RawProgram = {
  id: number;
  programName: string | null;
  status: ProgramRow["status"] | null;
  startDate: string | null;
  endDate: string | null;
  shops: number | null
};

type RawCampaign = {
  id: number;
  shops: number;
  budget: number | null;
  campaignName: string | null;
  description: string | null;
  codePrefix: string | null;
  startDate: string | null;
  endDate: string | null;
  campaign_goals: CampaignRow["campaignGoals"];
  status: CampaignRow["status"] | null;
  createDate: string;
  modifiedDate: string;
  programs?: RawProgram[];
};

function mapProgram(raw: RawProgram): ProgramRow {
  return {
    id: raw.id,
    programName: raw.programName,
    status: (raw.status ?? "Draft") as ProgramRow["status"],
    startDate: raw.startDate,
    endDate: raw.endDate,
  } as ProgramRow;
}

function mapCampaign(raw: RawCampaign): CampaignRow {
  const campaign: Partial<CampaignRow> = {
    id: raw.id,
    shops: raw.shops,
    budget: raw.budget,
    campaignName: raw.campaignName,
    description: raw.description ?? null,
    codePrefix: raw.codePrefix,
    campaignDates: {
      startDate: raw.startDate,
      endDate: raw.endDate,
    } as unknown as CampaignRow["campaignDates"],
    campaignGoals: raw.campaign_goals ?? [],
    status: (raw.status ?? "Draft") as CampaignRow["status"],
    createDate: raw.createDate,
    modifiedDate: raw.modifiedDate,
  };

  // If your CampaignRow also has discrete startDate/endDate fields, set them too:
  if ("startDate" in ({} as CampaignRow)) {
    (campaign as any).startDate = raw.startDate;
  }
  if ("endDate" in ({} as CampaignRow)) {
    (campaign as any).endDate = raw.endDate;
  }

  // Return with a strict type assertion after we’ve populated all known keys
  return campaign as CampaignRow;
}

export async function getCampaignForEdit(shopsID: number, campaignsID: number) {
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
        programName,
        status,
        startDate,
        endDate
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
