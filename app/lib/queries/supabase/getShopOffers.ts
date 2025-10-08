// app/lib/queries/supabase/getShopOffers.ts
import createClient from '../../../../supabase/server';
import type { OfferRow, OfferStatusType } from '../../types/dbTables';
import { OfferStatusEnum } from '../../types/dbTables';

export type GetShopOffersParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  statuses?: OfferStatusType[]; // ← Use the enum type
};

export type GetShopOffersResult = {
  offers: OfferRow[];
  count: number;
};

export async function getShopOffers(
  shopId: number,
  params: GetShopOffersParams = {}
): Promise<GetShopOffersResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    statuses = [
      OfferStatusEnum.AutoAccepted, 
      OfferStatusEnum.PendingReview
    ] as OfferStatusType[], // ← Use enum constants
  } = params;

  const { data, error } = await supabase.rpc('get_shop_offers', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_statuses: statuses,
  });

  if (error) {
    console.error('Error fetching shop offers:', error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const offers = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    offers,
    count: result.total_count || 0,
  };
}