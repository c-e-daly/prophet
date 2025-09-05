import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase/database.types";
import createClient from "../../utils/supabase/server";


const supabase: SupabaseClient<Database> = createClient();

// ---------- helpers ----------
const toStr = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const toNum = (v: unknown): number | null =>
  v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v);

const toISO = (v: unknown): string | null => {
  if (!v) return null;
  try {
    // Shopify often sends RFC 3339 strings already; ensure valid ISO output
    const d = new Date(String(v));
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
};

const toJSON = <T = unknown>(v: unknown, fallback: T): T => {
  if (v === null || v === undefined) return fallback as T;
  return v as T; // trust incoming JSON structure; DB column should be jsonb
};

// Convenience typed aliases for Insert payloads (confirm table names)
// If your actual table names differ, update below and the .from() calls accordingly.

type CheckoutsInsert = Database["public"]["Tables"]["checkouts"]["Insert"]; 
type OrdersInsert = Database["public"]["Tables"]["orders"]["Insert"]; 
type SubscriptionsInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]; 
type SubscriptionAttemptsInsert = Database["public"]["Tables"]["subscriptionAttempts"]["Insert"];  

// -----------------------------------------------------------------------------
// CHECKOUTS
// -----------------------------------------------------------------------------
export async function writeCheckout(payload: any, shop: string) {
  const record: CheckoutsInsert = {
    shopifyCheckoutId: toStr(payload?.id)!, 
    token: toStr(payload?.token), 
    cartToken: toStr(payload?.cart_token), 
    shopDomain: shop,
    email: toStr(payload?.email),
    currency: toStr(payload?.currency),
    totalPrice: toNum(payload?.total_price),
    totalTax: toNum(payload?.total_tax),
    discountCodes: toJSON(payload?.discount_codes ?? payload?.discount_code, []),
    lineItems: toJSON(payload?.line_items, []),
    createDate: toISO(payload?.created_at),
    modifiedDate: toISO(payload?.updated_at),
    payload: toJSON(payload, {}), // full raw payload (jsonb)
  };

  const { error } = await supabase
    .from("checkouts")"
    .upsert(record, { onConflict: "shopifyCheckoutId" });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// ORDERS
// -----------------------------------------------------------------------------
export async function writeOrder(payload: any, shop: string) {
  const record: OrdersInsert = {
    id: toStr(payload?.id)!,
    admin_graphql_api_id: toStr(payload?.admin_graphql_api_id),
    name: toStr(payload?.name),
    shop_domain: shop, // NOTE: map to `store_url` if your schema uses that name
    email: toStr(payload?.email),
    currency: toStr(payload?.currency),
    total_price: toNum(payload?.total_price),
    current_total_tax: toNum(payload?.current_total_tax ?? payload?.total_tax),
    financial_status: toStr(payload?.financial_status), // consider enum in DB later
    fulfillment_status: toStr(payload?.fulfillment_status), // consider enum in DB later
    cancelled_at: toISO(payload?.cancelled_at),
    cancel_reason: toStr(payload?.cancel_reason),
    cart_token: toStr(payload?.cart_token),
    checkout_token: toStr(payload?.checkout_token),
    customer_id: toStr(payload?.customer?.id),
    created_at: toISO(payload?.created_at),
    updated_at: toISO(payload?.updated_at),
    line_items: toJSON(payload?.line_items, []), // jsonb
    discount_codes: toJSON(payload?.discount_codes, []), // jsonb
    payload: toJSON(payload, {}),
  };

  const { error } = await supabase
    .from("orders") // NOTE: confirm actual table name; some schemas use "shopify_orders"
    .upsert(record, { onConflict: "id" });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// APP BILLING (Admin API App Subscriptions)
// -----------------------------------------------------------------------------
export async function writeAppSubscription(payload: any, shop: string) {
  const record: SubscriptionsInsert = {
    id: toStr(payload?.id)!,
    shop_domain: shop, // NOTE: if column is `store_url`, map here
    status: toStr(payload?.status), // e.g., ACTIVE | CANCELLED | FROZEN (consider enum)
    name: toStr(payload?.name ?? payload?.line_items?.[0]?.plan?.name),
    current_period_end: toISO(payload?.current_period_end),
    capped_amount: toNum(payload?.capped_amount),
    usage_balance: toNum(payload?.balance_used),
    updated_at: toISO(new Date().toISOString()), // server-side time of write
    payload: toJSON(payload, {}),
  };

  const { error } = await supabase
    .from("subscriptions") // NOTE: confirm table name; if `subscriptionBilling`, update here
    .upsert(record, { onConflict: "id" });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// STOREFRONT SUBSCRIPTION ATTEMPTS (Contracts billing attempts)
// -----------------------------------------------------------------------------
export async function writeSubscriptionAttempt(
  payload: any,
  shop: string,
  statusHint?: "success" | "failure"
) {
  const record: SubscriptionAttemptsInsert = {
    id: toStr(payload?.id)!,
    shop_domain: shop,
    status: toStr(payload?.status ?? statusHint), // consider enum: success | failure | pending
    subscription_contract_id: toStr(payload?.subscription_contract_id ?? payload?.contract?.id),
    order_id: toStr(payload?.order_id),
    occurred_at: toISO(payload?.occurred_at ?? payload?.processed_at),
    payload: toJSON(payload, {}),
  };

  const { error } = await supabase
    .from("subscriptionAttempts") // NOTE: confirm; original code pointed at "shopify_subscription_attempts"
    .upsert(record, { onConflict: "id" });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// UNINSTALLED → clean up your own rows
// -----------------------------------------------------------------------------
export async function handleAppUninstalled(shop: string) {
  // NOTE: Column naming varies in your repo between `shopDomain` and `store_url`.
  // If your shops table uses `store_url`, change the column below accordingly.
  const { error: shopsErr } = await supabase
    .from("shops")
    .update({ active: false as any }) // NOTE: confirm `active` boolean exists on shops
    .eq("shopDomain", shop); // NOTE: or `.eq("store_url", shop)` if that is your column

  if (shopsErr) throw shopsErr;

  // Likewise, your auth table appears as `shopauth` in some files and `shopAuths` in others.
  // Update to the actual table name you standardized on.
  const { error: authErr } = await supabase
    .from("shopauth") // NOTE: if your table is `shopAuths`, update name + column mapping
    .delete()
    .eq("shopDomain", shop); // NOTE: or `.eq("id", shop)` if domain is the PK

  if (authErr) throw authErr;
}


/*
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase/database.types";
import createClient from "../../utils/supabase/server";

const supabase: SupabaseClient<Database> = createClient();

// helpers
const toStr = (v: unknown) => (v === null || v === undefined ? null : String(v));
const toNum = (v: unknown) =>
  v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v);


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


export async function handleAppUninstalled(shop: string) {
  await supabase.from("shops").update({ active: false }).eq("shopDomain", shop);
  await supabase.from("shopAuths").delete().eq("shopDomain", shop);
}
*/