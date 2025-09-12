import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase/database.types";
import createClient from "../../utils/supabase/server";


const supabase: SupabaseClient<Database> = createClient();

function normalizeShopDomain(raw: string) {
  return raw.replace(/^https?:\/\//i, "").trim().toLowerCase();
}

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

type CheckoutsInsert = Database["public"]["Tables"]["shopifyCheckouts"]["Insert"]; 
type OrdersInsert = Database["public"]["Tables"]["shopifyOrders"]["Insert"]; 
type SubscriptionsInsert = Database["public"]["Tables"]["subscriptionBilling"]["Insert"]; 
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
    .from("shopifyCheckouts")
    .upsert(record, { onConflict: "shopifyCheckoutId" });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// ORDERS
// -----------------------------------------------------------------------------
export async function writeOrder(payload: any, shop: string) {
  const record: OrdersInsert = {
    id: toStr(payload?.id)!,
    orderGID: toStr(payload?.admin_graphql_api_id),
    name: toStr(payload?.name),
    shopDomain: shop, // NOTE: map to `store_url` if your schema uses that name
    email: toStr(payload?.email),
    currency: toStr(payload?.currency),
    totalPrice: toNum(payload?.total_price),
    totalTax: toNum(payload?.current_total_tax ?? payload?.total_tax),
    financialStatus: toStr(payload?.financial_status), // consider enum in DB later
    fulfillmentStatus: toStr(payload?.fulfillment_status), // consider enum in DB later
    cancelledAt: toISO(payload?.cancelled_at),
    cancelReason: toStr(payload?.cancel_reason),
    cartToken: toStr(payload?.cart_token),
    checkoutToken: toStr(payload?.checkout_token),
    customerGID: toStr(payload?.customer?.id),
    createDate: toISO(payload.created_at),
    modifiedDate: toISO(payload?.updated_at),
    lineItems: toJSON(payload?.line_items, []), // jsonb
    discountDodes: toJSON(payload?.discount_codes, []), // jsonb
    payload: toJSON(payload, {}),
  };

  const { error } = await supabase
    .from("shopifyOrders") // NOTE: confirm actual table name; some schemas use "shopify_orders"
    .upsert(record, { onConflict: "id" });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// APP BILLING (Admin API App Subscriptions)
// -----------------------------------------------------------------------------
export async function writeAppSubscription(payload: any, shop: string) {
  const record: SubscriptionsInsert = {
    id: toStr(payload?.id)!,
    shopDomain: shop, // NOTE: if column is `store_url`, map here
    status: toStr(payload?.status), // e.g., ACTIVE | CANCELLED | FROZEN (consider enum)
    name: toStr(payload?.name ?? payload?.line_items?.[0]?.plan?.name),
    currentPeriodEnd: toISO(payload?.current_period_end),
    cappedAmount: toNum(payload?.capped_amount),
    usageBalance: toNum(payload?.balance_used),
    modifiedDate: toISO(new Date().toISOString()), // server-side time of write
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
    shopDomain: shop,
    status: toStr(payload?.status ?? statusHint), // consider enum: success | failure | pending
    shopifySubscriptionGID: toStr(payload?.subscription_contract_id ?? payload?.contract?.id),
    orderID: toStr(payload?.order_id),
    occurredAt: toISO(payload?.occurred_at ?? payload?.processed_at),
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
export async function handleAppUninstalled(shopFromWebhook: string) {
  const shop = normalizeShopDomain(shopFromWebhook);

  // 1) Find the shop row (by domain or storeUrl)
  const { data: shops, error: findErr } = await supabase
    .from("shops")
    .select("id, shopDomain")
    .eq("shopDomain", shop)
    .limit(1)
    .maybeSingle();

  if (findErr) throw findErr;
  if (!shops?.id) throw new Error(`Shop not found for ${shop}`);

  const { error: shopsErr } = await supabase
    .from("shops")
    .update({
      isActive: false as any,
      uninstallDate: new Date().toISOString(),
    })
    .eq("id", shops.id);

  if (shopsErr) throw shopsErr;

  const { error: authErr } = await supabase
    .from("shopauth")
    .update({
      accessToken: "",
      shopifyScope: "",       
    })
    .eq("id", "shops.shopDomain");

  if (authErr) throw authErr;

  return { shopsID: shops.id, shopDomain: shops.shopDomain};
}






















































































