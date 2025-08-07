// app/lib/queries/dashboard_sales_summary.ts
import { createClient } from "../../utils/supabase/server";

export async function getDashboardSummary(shopDomain: string) {
  const supabase = createClient();

  const { data: auth, error: authError } = await supabase
    .from("shopauth")
    .select("shop_id")
    .eq("id", shopDomain)
    .single();

  if (authError || !auth?.shop_id) {
    throw new Error("Unable to find internal shop_id");
  }

  const { data, error } = await supabase.rpc("dashboard_sales_summary", {
    p_shop_id: auth.shop_id,
  });

  if (error) throw new Error(error.message);

  return data?.[0] || {};
}
