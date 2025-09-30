// app/lib/queries/supabase/getShopCounterAnalytics.ts
import  createClient  from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";

export type CounterTypeStats = {
  counter_type: string;
  total_sent: number;
  total_accepted: number;
  total_rejected: number;
  acceptance_rate: number;
  avg_margin_percent: number;
  avg_discount_cents: number;
  total_revenue_cents: number;
  total_margin_cents: number;
  avg_expected_value: number;
};

export type PortfolioStats = {
  portfolio: string;
  total_sent: number;
  total_accepted: number;
  acceptance_rate: number;
  avg_discount_percent: number;
  avg_margin_percent: number;
  avg_expected_value: number;
  total_revenue_cents: number;
};

export type UserStats = {
  user_id: number;
  user_name: string;
  total_sent: number;
  total_accepted: number;
  acceptance_rate: number;
  avg_expected_value: number;
  total_margin_cents: number;
};

export type CounterAnalyticsResult = {
  byType: CounterTypeStats[];
  byPortfolio: PortfolioStats[];
  byUser: UserStats[];
};

export async function getShopCounterAnalytics(
  shopId: number,
  dateRange: { start: string; end: string }
): Promise<CounterAnalyticsResult> {
  const supabase = createClient();

  // For now, return empty arrays until you create the RPC functions
  // Performance by counter type
  const { data: byType, error: typeError } = await supabase.rpc(
    'analyze_counter_performance_by_type',
    {
      p_shop_id: shopId,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
    }
  );

  if (typeError) {
    console.error('Error fetching counter type analytics:', typeError);
  }

  // Performance by portfolio
  const { data: byPortfolio, error: portfolioError } = await supabase.rpc(
    'analyze_counter_performance_by_portfolio',
    {
      p_shop_id: shopId,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
    }
  );

  if (portfolioError) {
    console.error('Error fetching portfolio analytics:', portfolioError);
  }

  // Performance by user
  const { data: byUser, error: userError } = await supabase.rpc(
    'analyze_counter_performance_by_user',
    {
      p_shop_id: shopId,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
    }
  );

  if (userError) {
    console.error('Error fetching user analytics:', userError);
  }

  return {
    byType: (byType as CounterTypeStats[]) ?? [],
    byPortfolio: (byPortfolio as PortfolioStats[]) ?? [],
    byUser: (byUser as UserStats[]) ?? [],
  };
}