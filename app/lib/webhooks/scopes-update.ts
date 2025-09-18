// app/lib/webhooks/scopes-update.ts - Clean Version
import createClient from "../../../supabase/server";

export interface ScopesUpdatePayload {
  granted_scopes: string[];
  revoked_scopes: string[];
  shop_domain: string;
}

export async function handleScopesUpdate(
  payload: ScopesUpdatePayload,
  shopDomain: string
): Promise<void> {
  const supabase = createClient();
  
  console.log("🔄 Processing scopes update for shop:", shopDomain);
  console.log("✅ Granted scopes:", payload.granted_scopes);
  console.log("❌ Revoked scopes:", payload.revoked_scopes);

  try {
    // 1. Find the shop in your database
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("shopDomain", shopDomain)
      .single();

    if (shopError || !shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    // 2. Update ONLY the scopes in shopauth (token stays in session)
    const { error: updateError } = await supabase
      .from("shopauth")
      .update({
        shopifyScope: payload.granted_scopes.join(","),
        modifiedDate: new Date().toISOString(),
      })
      .eq("shop", shop.id);

    if (updateError) {
      console.error("Failed to update shop scopes:", updateError);
      throw updateError;
    }

    // 3. Handle critical scope losses that break Prophet
    await handleCriticalScopeChanges(payload, shopDomain);

    console.log("✅ Scopes updated for:", shopDomain);

  } catch (error) {
    console.error("❌ Failed to process scopes update:", error);
    throw error;
  }
}

async function handleCriticalScopeChanges(
  payload: ScopesUpdatePayload,
  shopDomain: string
): Promise<void> {
  // Only handle scopes that would break Prophet's core functionality
  const criticalScopes = [
    "read_customers",
    "read_orders", 
    "write_discounts",
    "read_products"
  ];

  const lostCriticalScopes = payload.revoked_scopes.filter(scope => 
    criticalScopes.includes(scope)
  );

  if (lostCriticalScopes.length > 0) {
    console.error(`🚨 Critical scopes lost for ${shopDomain}:`, lostCriticalScopes);
    
    // Option 1: Log to your monitoring system
    // await notifyOpsTeam(shopDomain, lostCriticalScopes);
    
    // Option 2: Email the merchant
    // await emailMerchant(shopDomain, lostCriticalScopes);
    
    // Option 3: Set a flag to show a warning in the app UI
    // (you'd check this flag when loading the app)
  }
}