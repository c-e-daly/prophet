// app/lib/queries/createProgram.ts
import createClient from "../../utils/supabase/admin";

const supabase = createClient();

type Input = {
  campaignId: number;
  name: string;
  type?: string | null;
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  startDate?: string | null;
  endDate?: string | null;
};

export async function createShopProgram(shopId: number, input: Input): Promise<number> {
  const row = {
    shop: shopId,
    campaign: input.campaignId,
    name: input.name,
    type: input.type ?? null,
    status: input.status ?? "DRAFT",
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
  };

  const { data, error } = await supabase
    .from("programs")
    .insert(row)
    .select("id")
    .single();

  if (error) throw error;
  return data!.id as number;
}
