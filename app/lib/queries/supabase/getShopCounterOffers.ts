// app/lib/queries/supabase/counterOffers/getCounterOffers.ts
import createClient from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

type OfferRow = Tables<"offers">;
type RawOfferStatus = OfferRow["offerStatus"];          // e.g. "Auto Accepted" | ... | null
type OfferStatusNN = Exclude<RawOfferStatus, null>;     // remove null

const COUNTER_STATUSES = [
  "Reviewed Countered",
  "Consumer Accepted",
  "Consumer Declined",
  "Counter Accepted Expired",
  "Countered Withdrawn",
  "Requires Approval",
  "Consumer Countered",
  "Declined Consumer Counter",
  "Accepted Consumer Counter",
] as const satisfies readonly OfferStatusNN[];

export async function getCounterOffers(
    shopsID: number,
  options: {
    monthsBack?: number;
    limit?: number;
    page?: number;
    statuses?: readonly OfferStatusNN[]; // allow override but keep strong typing
  } = {}
) {

  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    statuses = COUNTER_STATUSES,
  } = options;

  const offset = (page - 1) * limit;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
  const statusArray: OfferStatusNN[] = [...statuses];
  
  
  const supabase = createClient();
    const { data, error } = await supabase
    .from('counterOffers')
    .select(`
      *,
      offers (
        id,
        consumerEmail,
        consumerName,
        cartTotalPrice
      )
    `)
    .eq('shops', shopsID)
    .order('createDate', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map(co => ({
    ...co,
    consumerEmail: co.offers?.consumerEmail,
    consumerName: co.offers?.consumerName,
  }));
}