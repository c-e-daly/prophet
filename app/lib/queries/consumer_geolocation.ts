// app/lib/queries/consumer_geolocation.ts
import { createClient } from "../../utils/supabase/server";

export async function getConsumerGeolocation(shopDomain: string) {
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
  console.log("[geolocation] consumer_gelocation args:", {
    shopDomain,
    "auth.shop_id(raw)": rawShopId,
    "auth.shop_id(typeof)": typeof rawShopId,
    p_shop_id: pShopId,
    "p_shop_id(isFinite)": Number.isFinite(pShopId),
  });

  const { data, error } = await supabase.rpc("consumer_geolocation", {
    p_shop_id: pShopId,
  });

  if (error) {
    console.error("[geolocation] RPC error:", error);
    throw new Error(error.message);
  }

  console.log("[geolocation] RPC ok. typeof data:", typeof data); // should be 'object'
  return data ?? {};
}

