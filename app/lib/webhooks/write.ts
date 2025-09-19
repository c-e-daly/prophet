import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase/database.types";
import createClient from "../../../supabase/server";
import { getShopsIDHelper } from "../../../supabase/getShopsID.server";
type Json = Database["public"]["Functions"]["ingest_shopify_order"]["Args"]["_payload"];

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

export type OrderWebhookTopic =
  | "ORDERS_CREATE"
  | "ORDERS_UPDATED"
  | "ORDERS_CANCELLED"
  | "ORDERS_FULFILLED";

type WriteOrderOptions = {
  topic: OrderWebhookTopic;
  /**
   * Raw request body string from Shopify webhook.
   * If provided, we'll call the *_text RPC to avoid any bigint precision loss.
   */
  rawBody?: string;
};

export async function writeOrder(
  payload: unknown,          // already-parsed JSON (safe fallback)
  shopDomain: string,
  opts: WriteOrderOptions
): Promise<number> {
  const supabase = createClient(); // service role
  const shopsID = await getShopsIDHelper(shopDomain);
  if (!shopsID) {
    // Config issue — no tenant for this shop
    throw new Error(`shopsID not found for shopDomain=${shopDomain}`);
  }

  // 1) Ingest raw order into shopifyOrders
  let orderID: number;
  if (opts.rawBody) {
    // Preferred: preserves 64-bit integers from Shopify
    const { data, error } = await supabase.rpc("ingest_shopify_order_text", {
      _shops_id: shopsID,
      _payload_json: opts.rawBody,
    });
    if (error) throw error;
    orderID = data as number;
  } else {
    // Fallback: uses parsed JSON; OK if upstream didn’t coerce huge ints to JS number
    const { data, error } = await supabase.rpc("ingest_shopify_order", {
      _shops_id: shopsID,
      _payload: payload as Json,
    });
    if (error) throw error;
    orderID = data as number;
  }

  // 2) Line items → shopifyOrderDetails for relevant topics
  switch (opts.topic) {
    case "ORDERS_CREATE":
    case "ORDERS_UPDATED":
    case "ORDERS_FULFILLED": {
      const { error } = await supabase.rpc("upsert_shopify_order_detals", orderID);
      if (error) throw error;
      break;
    }
    case "ORDERS_CANCELLED":
      // (Optional) If you want to zero/flag lines on cancel, call a cancel RPC here.
      break;
  }

  return orderID;

/*
export async function writeOrder(payload: any, shop: string) {
  console.log("📝 Writing order:", payload?.id, "for shop:", shop);
  
  try {
const record: OrdersInsert = {
      id: toNum(payload?.id)!,
      orderGID: toStr(payload?.admin_graphql_api_id) ?? undefined,
      totalPrice: toNum(payload?.total_price) ?? undefined,
      totalTax: toNum(payload?.current_total_tax ?? payload?.total_tax) ?? undefined,
      financialStatus: toStr(payload?.financial_status) ?? undefined,
      fulfillmentStatus: toStr(payload?.fulfillment_status) ?? undefined,
      cancelledAt: toISO(payload?.cancelled_at) ?? undefined,
      cancelReason: toStr(payload?.cancel_reason) ?? undefined,
      cartToken: toStr(payload?.cart_token) ?? undefined,
      checkoutToken: toStr(payload?.checkout_token) ?? undefined,
      created_at: toISO(payload?.created_at) ?? undefined, // This should fix your error
      modifiedDate: toISO(payload?.updated_at) ?? undefined,
      lineItems: toJSON(payload?.line_items, []),
      discountCodes: toJSON(payload?.discount_codes, []),
      shopGID: toStr(payload?.shop_id) ?? undefined,
      payload: toJSON(payload, {}),
    };

                                                                                        
    console.log("📊 Order record to insert:", {
      id: record.id,
      name: record.name,
      shopDomain: record.shopDomain,
      email: record.email
    });

    const { error } = await supabase
      .from("orders")
      .upsert(record, { onConflict: "id" });
      
    if (error) {
      console.error("❌ Database error writing order:", error);
      throw error;
    }
    
    console.log("✅ Order successfully written to database");
    
  } catch (error) {
    console.error("❌ Failed to write order:", error);
    throw error;
  }
}

*/
// -----------------------------------------------------------------------------
// APP BILLING (Admin API App Subscriptions)
// -----------------------------------------------------------------------------
export async function writeAppSubscription(payload: any, shop: string) {
  const record: SubscriptionsInsert = {
    id: toNum(payload?.id)!,
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
    id: toNum(payload?.id)!,
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
    .eq(shop, "shopDomain")
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


// -----------------------------------------------------------------------------
// SCOPES UPDATE → update shopauth with current scopes
// -----------------------------------------------------------------------------
export interface ScopesUpdatePayload {
  id: number;
  shop_id: string;
  previous: string[];
  current: string[];
  updated_at: string;
}

export async function handleScopesUpdate(payload: ScopesUpdatePayload, shopDomain: string) {
  console.log("🔄 Processing scopes update for shop:", shopDomain);
  console.log("📋 Previous scopes:", payload.previous);
  console.log("✅ Current scopes:", payload.current);

  // Calculate granted and revoked scopes
  const grantedScopes = payload.current.filter(scope => !payload.previous.includes(scope));
  const revokedScopes = payload.previous.filter(scope => !payload.current.includes(scope));

  console.log("🆕 Granted scopes:", grantedScopes);
  console.log("❌ Revoked scopes:", revokedScopes);

  try {
    // 1. Find the shop in your database
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("shopDomain", normalizeShopDomain(shopDomain))
      .single();

    if (shopError || !shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    // 2. Update the current scopes in shopauth
    const { error: updateError } = await supabase
      .from("shopauth")
      .update({
        shopifyScope: payload.current.join(","),
        modifiedDate: new Date().toISOString(),
      })
      .eq("shops", shop.id);

    if (updateError) {
      console.error("Failed to update shop scopes:", updateError);
      throw updateError;
    }

    // 3. Handle critical scope losses that break Prophet
    const criticalScopes = [
      "read_customers",
      "read_orders", 
      "write_discounts",
      "read_products"
    ];

    const lostCriticalScopes = revokedScopes.filter(scope => 
      criticalScopes.includes(scope)
    );

    if (lostCriticalScopes.length > 0) {
      console.error(`🚨 CRITICAL: Prophet functionality compromised for ${shopDomain}:`);
      console.error(`Lost scopes: ${lostCriticalScopes.join(", ")}`);
      
      // Optional: Send alert to your monitoring system
      // await alertOpsTeam(shopDomain, lostCriticalScopes);
    }

    // 4. Log positive changes too
    if (grantedScopes.length > 0) {
      console.log(`🎉 New scopes granted for ${shopDomain}: ${grantedScopes.join(", ")}`);
    }

    console.log("✅ Scopes updated for:", shopDomain);

  } catch (error) {
    console.error("❌ Failed to process scopes update:", error);
    throw error;
  }
}


//-----------------------------------//
// gdpr consumer request 
//-----------------------------------//

// Add this to your existing types section
type GdprRequestsInsert = Database["public"]["Tables"]["gdprrequests"]["Insert"];

export async function writeGdprRequest(payload: any, shop: string) {
  const shop_domain = normalizeShopDomain(shop);
  const shop_id: number | null = toNum(payload?.shop_id);
  const customer_email: string | null = toStr(payload?.customer?.email);
  const customerGID: string | null = toStr(payload?.customer?.id);

  if (!customerGID) {
    throw new Error("Missing customer ID in GDPR request");
  }

  // Find the shop
  const { data: shopData, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .or(`shop_id.eq.${shop_id},shopDomain.eq.${shop_domain}`)
    .maybeSingle();

  if (shopError) throw shopError;
  if (!shopData) throw new Error(`Shop not found for domain: ${shop_domain}, id: ${shop_id}`);

  // Find the consumer
  const { data: consumerData, error: consumerError } = await supabase
    .from("consumers")
    .select("id")
    .eq("customerShopifyGID", customerGID)
    .maybeSingle();

  if (consumerError) throw consumerError;
  if (!consumerData) throw new Error(`Consumer not found for customerShopifyGID: ${customerGID}`);

  // Insert GDPR request - removed payload field
  const record: GdprRequestsInsert = {
    topic: "customers/data_request",
    consumers: consumerData.id,
    shops: shopData.id,
    shop_domain,
    shop_id,
    customer_email,
    customerGID,
    received_at: toISO(new Date().toISOString())!,
    // payload: toJSON(payload, {}), // Remove this line
  };

  const { error } = await supabase
    .from("gdprrequests")
    .upsert(record, { onConflict: "customerGID,shops" });

  if (error) throw error;
}

//-------------------------//
//  GDPR CUSTOMERS REDACT 
//-------------------------//

// Add this function to write.ts
export async function writeGdprRedactRequest(payload: any, shop: string) {
  const shop_domain = normalizeShopDomain(shop);
  const shop_id: number | null = toNum(payload?.shop_id);
  const customer_email: string | null = toStr(payload?.customer?.email);
  const customerGID: string | null = toStr(payload?.customer?.id);

  // Find the shop (try shop_id first, then shopDomain)
  let shopData = null;
  if (shop_id !== null) {
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("shop_id", shop_id)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) shopData = data;
  }
  
  if (!shopData && shop_domain) {
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("shopDomain", shop_domain)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) shopData = data;
  }

  if (!shopData) {
    throw new Error(`Shop not found for domain: ${shop_domain}, id: ${shop_id}`);
  }

  // Find the consumer (try customerGID first, then email)
  let consumerData = null;
  if (customerGID) {
    const { data, error } = await supabase
      .from("consumers")
      .select("id")
      .eq("customerGID", customerGID)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) consumerData = data;
  }
  
  if (!consumerData && customer_email) {
    const { data, error } = await supabase
      .from("consumers")
      .select("id")
      .eq("email", customer_email)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) consumerData = data;
  }

  if (!consumerData) {
    throw new Error(`Consumer not found for customerGID: ${customerGID}, email: ${customer_email}`);
  }

  // Insert GDPR redact request
  const record: GdprRequestsInsert = {
    topic: "customers/redact",
    shops: shopData.id,
    consumers: consumerData.id,
    shop_domain,
    shop_id,
    customer_email,
    customerGID,
    received_at: toISO(new Date().toISOString())!,
  };

  const { error } = await supabase
    .from("gdprrequests")
    .upsert(record, { onConflict: "customerGID,shops" });

  if (error) throw error;
}


//---------------------------//
//  GDPR SHOP REDACT
//---------------------------//


// Add this function to write.ts
export async function writeShopRedactRequest(payload: any, shop: string) {
  const shop_domain = normalizeShopDomain(shop);
  const shop_id: number | null = toNum(payload?.shop_id);

  // Find the shop (try shop_id first, then shopDomain)
  let shopData = null;
  if (shop_id !== null) {
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("shop_id", shop_id)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) shopData = data;
  }
  
  if (!shopData && shop_domain) {
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("shopDomain", shop_domain)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) shopData = data;
  }

  if (!shopData) {
    throw new Error(`Shop not found for domain: ${shop_domain}, id: ${shop_id}`);
  }

  // Insert shop redact request
  const record: GdprRequestsInsert = {
    topic: "shop/redact",
    shops: shopData.id,
    consumers: null, // not applicable for shop/redact
    shop_domain,
    shop_id,
    customer_email: null,
    customerGID: null,
    received_at: toISO(new Date().toISOString())!,
  };

  const { error } = await supabase
    .from("gdprrequests")
    .upsert(record, { onConflict: "shops" }); // adjust conflict resolution as needed

  if (error) throw error;
}
