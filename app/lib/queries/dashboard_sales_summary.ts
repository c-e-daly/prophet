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
    console.error("[dashboard] shopauth lookup failed", { shopDomain, authError, auth });
    throw new Error("Unable to find internal shop_id");
  }

  const rawShopId = auth.shop_id;           // could be string/number
  const pShopId = Number(rawShopId);        // RPC expects a number (BIGINT in SQL)

  // 👇 This is the log you asked for
  console.log("[dashboard] dashboard_sales_summary args:", {
    shopDomain,
    "auth.shop_id(raw)": rawShopId,
    "auth.shop_id(typeof)": typeof rawShopId,
    p_shop_id: pShopId,
    "p_shop_id(isFinite)": Number.isFinite(pShopId),
  });

  const { data, error } = await supabase.rpc("dashboard_sales_summary", {
    p_shop_id: pShopId,
  });

  if (error) {
    console.error("[dashboard] RPC error:", error);
    throw new Error(error.message);
  }

  console.log("[dashboard] RPC ok. typeof data:", typeof data); // should be 'object'
  return data ?? {};
}


/*
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
*/