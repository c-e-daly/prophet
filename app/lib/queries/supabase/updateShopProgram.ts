// app/lib/queries/updateProgram.ts
import createClient from "../../../../supabase/admin";
const supabase = createClient();

type Input = {
  id: number;
  campaignId: number;
  name: string;
  type?: string | null;
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  startDate?: string | null;
  endDate?: string | null;
};

export async function updateProgram(shopId: number, input: Input): Promise<void> {
  const row = {
    campaign: input.campaignId,
    name: input.name,
    type: input.type ?? null,
    status: input.status ?? "DRAFT",
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
  };

  const { error } = await supabase
    .from("programs")
    .update(row)
    .eq("shop", shopId)
    .eq("id", input.id);

  if (error) throw error;
}
