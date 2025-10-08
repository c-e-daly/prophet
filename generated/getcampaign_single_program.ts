// app/lib/queries/supabase/getcampaign_single_program.ts
// Generated: 2025-10-08T01:09:33.067Z
import createClient from '../../../../supabase/server';
import type { ProgramRow } from '../../types/dbTables';

export type GetProgramParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetProgramResult = {
  Program: ProgramRow[];
  count: number;
};

export async function getShopcampaignSingleProgram(
  shopId: number,
  params: GetProgramParams = {}
): Promise<GetProgramResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_campaign_single_program', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching Program:', error);
    throw new Error(`Failed to fetch Program: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const Program = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    Program,
    count: result.total_count || 0,
  };
}
