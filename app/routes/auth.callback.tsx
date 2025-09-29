//app/routes/auth.callback.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("🔐🔐🔐 AUTH ROUTE HIT - URL:", request.url);
  console.log("🔐🔐🔐 AUTH ROUTE HIT - Timestamp:", new Date().toISOString());
  
  try {
    const { admin, session } = await authenticate.admin(request);
    
    console.log("🔐 OAuth authentication successful:", {
      shop: session?.shop,
      hasToken: !!session?.accessToken,
      scope: session?.scope
    });

    if (!session?.shop || !session?.accessToken) {
      console.error("🔐 Auth missing shop or token");
      throw new Error("Auth missing shop or token");
    }

    // Store shop data once during OAuth
    console.log("🔐 Storing shop data during OAuth callback...");
    await storeShopData(session, admin);
    console.log("🔐 Shop data stored successfully during OAuth");

    // Redirect to the app
    const url = new URL(request.url);
    const host = url.searchParams.get("host");
    
    const params = new URLSearchParams();
    params.set("shop", session.shop);
    if (host) params.set("host", host);
    
    console.log("🔐 Redirecting to app after OAuth:", `/app?${params.toString()}`);
    return redirect(`/app?${params.toString()}`);
    
  } catch (error) {
    console.error("🔐 OAuth callback error:", error);
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return redirect("/app?error=auth_failed");
  }
};

// Store shop data during OAuth callback
async function storeShopData(session: any, admin: any) {
  console.log("💾 STORING SHOP DATA DURING OAUTH - Timestamp:", new Date().toISOString());
  console.log("💾 Session data:", { 
    shop: session?.shop, 
    hasToken: !!session?.accessToken,
    scope: session?.scope 
  });
  
  const supabase = createClient();
  
  try {
    const now = new Date().toISOString();
    
    // Use temporary shop ID until we can get real one
    const tempShopGID = "temp_" + Date.now();
    
    // Prepare shop data - using only session data for now
    const shopData = {
      shopsGID: tempShopGID,
      shopDomain: session.shop,
      brandName: session.shop,
      companyLegalName: session.shop,
      storeCurrency: 'USD',
      commercePlatform: "shopify",
      companyPhone: null,
      companyAddress: null,
      isActive: true,
      createDate: now,
      modifiedDate: now,
    };
    
    console.log("💾 Upserting shop data:", shopData);
    
    // Upsert shop data
    const { data: shopsRow, error: shopError } = await supabase
      .from("shops")
      .upsert(shopData, { onConflict: "shopDomain" })
      .select()
      .single();
    
    if (shopError) {
      console.error("💾 Shop upsert error:", shopError);
      throw new Error(`Shop upsert failed: ${shopError.message}`);
    }
    
    if (!shopsRow) {
      throw new Error("Shop upsert returned no data");
    }
    
    console.log("💾 Shop upserted successfully:", { id: shopsRow.id, domain: shopsRow.shopDomain });
    
    // THE CRITICAL PART - Store the access token
    const authData = {
      id: session.shop,
      shops: shopsRow.id,
      shopsGID: tempShopGID,
      shopName: session.shop,
      accessToken: session.accessToken, // THE CRITICAL ACCESS TOKEN
      shopifyScope: session.scope || '',
      createDate: now,
      modifiedDate: now,
      created_by: "oauth_callback",
    };
    
    console.log("💾 Upserting auth data:", { 
      ...authData, 
      accessToken: session.accessToken ? "[ACCESS TOKEN EXISTS]" : "[NO ACCESS TOKEN]"
    });
    
    // Upsert auth data
    const { data: authRow, error: authError } = await supabase
      .from("shopauth")
      .upsert(authData, { onConflict: "id" })
      .select()
      .single();
    
    if (authError) {
      console.error("💾 Auth upsert error:", authError);
      throw new Error(`Auth upsert failed: ${authError.message}`);
    }
    
    console.log("💾 ACCESS TOKEN STORED SUCCESSFULLY:", { id: authRow.id });
    
    return { shop: shopsRow, auth: authRow };
    
  } catch (error) {
    console.error("💾 Error storing shop data during OAuth:", error);
    throw error;
  }
}