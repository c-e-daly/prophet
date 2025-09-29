// app/lib/queries/supabase/getCounterOfferAnalytics.ts
import createClient from "../../../../supabase/server";
export async function getShopCounterAnalytics(
  shopId: number,
  dateRange: { start: string; end: string }
) {
  const supabase = createClient();
  
  // Performance by counter type
  const { data: byType } = await supabase.rpc('analyze_counter_performance_by_type', {
    p_shop_id: shopId,
    p_start_date: dateRange.start,
    p_end_date: dateRange.end,
  });
  
  // Performance by portfolio
  const { data: byPortfolio } = await supabase.rpc('analyze_counter_performance_by_portfolio', {
    p_shop_id: shopId,
    p_start_date: dateRange.start,
    p_end_date: dateRange.end,
  });
  
  // Performance by user
  const { data: byUser } = await supabase.rpc('analyze_counter_performance_by_user', {
    p_shop_id: shopId,
    p_start_date: dateRange.start,
    p_end_date: dateRange.end,
  });
  
  return { byType, byPortfolio, byUser };
}