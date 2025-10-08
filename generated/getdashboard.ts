// app/lib/queries/supabase/getdashboard.ts
// Generated: 2025-10-08T01:09:56.215Z
import createClient from '../../../../supabase/server';
import type { DashboardRow } from '../../types/dbTables';

export type GetDashboardParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetDashboardResult = {
  Dashboard: DashboardRow[];
  count: number;
};

export async function getShopdashboard(
  shopId: number,
  params: GetDashboardParams = {}
): Promise<GetDashboardResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_dashboard', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching Dashboard:', error);
    throw new Error(`Failed to fetch Dashboard: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const Dashboard = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    Dashboard,
    count: result.total_count || 0,
  };
}
