// app/lib/queries/getShopOffers.ts - UPDATED VERSION
import type { Tables, Enum } from "../../types/dbTables";

export type OfferRow = Tables<"offers">;
export type offerStatus = Enum<"offerStatus">;

type OfferStatus = OfferRow extends { offerStatus: infer S }
  ? (S extends string ? S : string)
  : string;

export type GetShopOfferOptions = {
  monthsBack?: number;
  limit?: number;
  page?: number;                
  status?: OfferStatus;         
  statuses?: OfferStatus[];     
  beforeCreatedAt?: string;     
  beforeId?: string | number;   
};


export async function getShopOffers(
  shopsId: number, 
  options: {
    monthsBack?: number;
    limit?: number;
    page?: number;
    statuses?: string[];
  } = {}
) {
  const { createClient } = await import("../../../utils/supabase/server");
  const supabase = createClient();

  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
  } = options;

  const offset = (page - 1) * limit;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

  // FAST QUERY: Direct foreign key lookup instead of JOIN
  let query = supabase
    .from("offers")
    .select("*", { count: "exact" })
    .eq("shops", shopsId) // Fast! No JOIN needed
    .gte("offerCreateDate", cutoffDate.toISOString())
    .order("offerCreateDate", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: offers, error, count } = await query;

  if (error) {
    console.error("Error fetching offers:", error);
    throw new Error("Failed to fetch offers");
  }

  return {
    offers: offers || [],
    count: count || 0,
  };
}