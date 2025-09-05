import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase/database.types";
import createClient from "../../utils/supabase/server";

const supabase: SupabaseClient<Database> = createClient();

// helpers
const toStr = (v: unknown) => (v === null || v === undefined ? null : String(v));
const toNum = (v: unknown) =>
  v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v);

/** CHECKOUTS */
export async function writeCheckout(payload: any, shop: string) {
  const record = {
    id: toStr(payload?.id),                    // recommend TEXT in DB
    token: toStr(payload?.token),
    cart_token: toStr(payload?.cart_token),
    shop_domain: shop,
    email: payload?.email ?? null,
    currency: payload?.currency ?? null,
    total_price: toNum(payload?.total_price),
    total_tax: toNum(payload?.total_tax),
    discount_codes: payload?.discount_codes ?? payload?.discount_code ?? null,
    line_items: payload?.line_items ?? [],
    created_at: payload?.created_at ?? null,
    updated_at: payload?.updated_at ?? null,
    payload,
  };
  const { error } = await supabase.from("checkouts").upsert(record, { onConflict: "id" });
  if (error) throw error;
}

/** ORDERS */
export async function writeOrder(payload: any, shop: string) {
  const record = {
    id: toStr(payload?.id),
    admin_graphql_api_id: payload?.admin_graphql_api_id ?? null,
    name: payload?.name ?? null,
    shop_domain: shop,
    email: payload?.email ?? null,
    currency: payload?.currency ?? null,
    total_price: toNum(payload?.total_price),
    current_total_tax: toNum(payload?.current_total_tax ?? payload?.total_tax),
    financial_status: payload?.financial_status ?? null,
    fulfillment_status: payload?.fulfillment_status ?? null,
    cancelled_at: payload?.cancelled_at ?? null,
    cancel_reason: payload?.cancel_reason ?? null,
    cart_token: toStr(payload?.cart_token),
    checkout_token: toStr(payload?.checkout_token),
    customer_id: toStr(payload?.customer?.id),
    created_at: payload?.created_at ?? null,
    updated_at: payload?.updated_at ?? null,
    line_items: payload?.line_items ?? [],
    discount_codes: payload?.discount_codes ?? [],
    payload,
  };
  const { error } = await supabase.from("orders").upsert(record, { onConflict: "id" });
  if (error) throw error;
}

/** APP BILLING (App Subscriptions) */
export async function writeAppSubscription(payload: any, shop: string) {
  const record = {
    id: toStr(payload?.id),
    shop_domain: shop,
    status: payload?.status ?? null,           // ACTIVE | CANCELLED | ...
    name: payload?.name ?? payload?.line_items?.[0]?.plan?.name ?? null,
    current_period_end: payload?.current_period_end ?? null,
    capped_amount: toNum(payload?.capped_amount),
    usage_balance: toNum(payload?.balance_used),
    updated_at: new Date().toISOString(),
    payload,
  };
  const { error } = await supabase.from("subscriptions").upsert(record, { onConflict: "id" });
  if (error) throw error;
}

/** STOREFRONT SUBSCRIPTION ATTEMPTS */
export async function writeSubscriptionAttempt(payload: any, shop: string, statusHint?: "success" | "failure") {
  const record = {
    id: toStr(payload?.id),
    shop_domain: shop,
    status: payload?.status ?? statusHint ?? null,
    subscription_contract_id: toStr(payload?.subscription_contract_id ?? payload?.contract?.id),
    order_id: toStr(payload?.order_id),
    occurred_at: payload?.occurred_at ?? null,
    payload,
  };
  const { error } = await supabase.from("shopify_subscription_attempts").upsert(record, { onConflict: "id" });
  if (error) throw error;
}

/** UNINSTALLED → clean up your own rows */
export async function handleAppUninstalled(shop: string) {
  await supabase.from("shops").update({ active: false }).eq("shopDomain", shop);
  await supabase.from("shopAuths").delete().eq("shopDomain", shop);
}
