// app/lib/queries/supabase/getcounter_templates.ts
// Generated: 2025-10-08T01:10:37.538Z
import createClient from '../../../../supabase/server';
import type { CounterTemplateRow } from '../../types/dbTables';

export type GetCounterTemplateParams = {
  monthsBack?: number;
  limit?: number;
  page?: number;
  beforeId?: number;
};

export type GetCounterTemplateResult = {
  CounterTemplate: CounterTemplateRow[];
  count: number;
};

export async function getShopcounterTemplates(
  shopId: number,
  params: GetCounterTemplateParams = {}
): Promise<GetCounterTemplateResult> {
  const supabase = createClient();
  
  const {
    monthsBack = 12,
    limit = 50,
    page = 1,
    beforeId,
  } = params;

  const { data, error } = await supabase.rpc('get_shop_counter_templates', {
    p_shops_id: shopId,
    p_months_back: monthsBack,
    p_limit: limit,
    p_page: page,
    p_before_id: beforeId,
  });

  if (error) {
    console.error('Error fetching CounterTemplate:', error);
    throw new Error(`Failed to fetch CounterTemplate: ${error.message}`);
  }

  const result = data?.[0] || { rows: [], total_count: 0 };
  
  const CounterTemplate = Array.isArray(result.rows) 
    ? result.rows 
    : typeof result.rows === 'string'
    ? JSON.parse(result.rows)
    : [];
  
  return {
    CounterTemplate,
    count: result.total_count || 0,
  };
}
