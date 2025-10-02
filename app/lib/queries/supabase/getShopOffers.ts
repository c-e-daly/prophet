// app/lib/queries/getShopOffers.ts
import createClient from "../../../../supabase/server";
import type { Tables } from "../../types/dbTables";

// Derive the enum straight from your generated types
type OfferRow = Tables<"offers">;
type RawOfferStatus = OfferRow["offerStatus"];          // e.g. "Auto Accepted" | ... | null
type OfferStatusNN = Exclude<RawOfferStatus, null>;     // remove null

// Default statuses for the counteroffers page
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

// -----------------------------------
// Unchanged: getShopOffers (base list)
// -----------------------------------
export async function getShopOffers(
  shopsID: number,
  options: {
    monthsBack?: number;
    limit?: number;
    page?: number;
  } = {}
) {
  const supabase = createClient();

  const { monthsBack = 12, limit = 50, page = 1 } = options;

  const offset = (page - 1) * limit;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

  const { data: offers, error, count } = await supabase
    .from("offers")
    .select("*", { count: "exact" })
    .eq("shops", shopsID)
    .gte("createDate", cutoffDate.toISOString())
    .order("createDate", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching offers:", error);
    throw new Error("Failed to fetch offers");
  }

  return { offers: offers || [], count: count || 0 };
}

// -------------------------------------------------
// Filtered: getShopOffersByStatus (counteroffers)
// -------------------------------------------------
export async function getShopOffersByStatus(
  shopsID: number,
  options: {
    monthsBack?: number;
    limit?: number;
    page?: number;
    statuses?: readonly OfferStatusNN[]; // allow override but keep strong typing
  } = {}
) {
  const supabase = createClient();

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

  const { data: offers, error, count } = await supabase
    .from("offers")
    .select("*", { count: "exact" })
    .eq("shops", shopsID)
    .gte("createDate", cutoffDate.toISOString())
    .in("offerStatus", statusArray)
    .order("createDate", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching offers by status:", error);
    throw new Error("Failed to fetch offers by status");
  }

  return { offers: offers || [], count: count || 0 };
}
