// app/routes/auth.$.tsx (WITH SESSION MANAGEMENT) =====
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import { setPartialShopSession, upgradeToCompleteSession } from "../lib/session/shopSession.server";
import createClient from "../utils/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== AUTH FLOW START ===");
  console.log("Request URL:", request.url);

  try {
    // Handle both /auth and /auth/callback
    const { admin, session } = await authenticate.admin(request);
    
    console.log("✅ Authentication successful:", {
      shop: session.shop,
      hasToken: !!session.accessToken,
    });

    // First, set partial session with Shopify data
    const partialCookie = await setPartialShopSession(
      request,
      session.shop,
      session.shop.replace(".myshopify.com", ""),
      !!session.accessToken
    );

    // Store/update shop data in Supabase
    const { shopsRow, shopsId, shopsBrandName } = await storeShopData(session, admin);

    // Upgrade to complete session with Supabase data
    const completeCookie = await upgradeToCompleteSession(
      request,
      shopsRow,
      shopsId,
      shopsBrandName
    );

    // Get URL params for redirect
    const url = new URL(request.url);
    const host = url.searchParams.get("host");
    
    // Redirect to embedded app with session cookie
    const appUrl = `/app?shop=${encodeURIComponent(session.shop)}${
      host ? `&host=${encodeURIComponent(host)}` : ""
    }`;
    
    console.log("🔄 Redirecting to:", appUrl);
    return redirect(appUrl, {
      headers: { "Set-Cookie": completeCookie }
    });
    
  } catch (error) {
    console.log("Auth error:", error);
    
    // If it's a redirect (normal OAuth flow), let it through
    if (error instanceof Response && error.status === 302) {
      console.log("🔄 OAuth redirect to:", error.headers.get("location"));
      throw error;
    }
    
    // Other errors
    console.error("❌ Auth failed:", error);
    return redirect("/app?error=auth_failed");
  }
}

async function storeShopData(session: any, admin: any) {
  const supabase = createClient();
  
  try {
    // Get shop info from Shopify
    const shopResponse = await admin.rest.resources.Shop.all({ session });
    const shopInfo = shopResponse.data[0];
    
    if (!shopInfo) {
      throw new Error("Could not fetch shop info");
    }

    // Store/update in shops table
    const { data: shopsRow, error: shopError } = await supabase
      .from("shops")
      .upsert({
        shop_id: shopInfo.id,
        shopDomain: session.shop,
        brand_name: shopInfo.name,
        company_legal_name: shopInfo.name,
        store_currency: shopInfo.currency,
        commerce_platform: "shopify",
        company_phone: shopInfo.phone || null,
        company_address: shopInfo.address1
          ? {
              address1: shopInfo.address1,
              address2: shopInfo.address2,
              city: shopInfo.city,
              province: shopInfo.province,
              country: shopInfo.country,
              zip: shopInfo.zip,
            }
          : null,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      }, { 
        onConflict: "shopDomain" 
      })
      .select()
      .single();

    if (shopError || !shopsRow) throw new Error("Shop upsert failed");

    // Store/update auth info
    const { error: authError } = await supabase
      .from("shopauth")
      .upsert({
        id: session.shop,
        shop: shopsRow.id, // FK to shops table
        shop_id: shopInfo.id,
        shop_name: shopInfo.name,
        access_token: session.accessToken,
        shopify_scope: session.scope,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        created_by: "oauth_callback",
      }, { 
        onConflict: "id" 
      });

    if (authError) throw authError;
    
    console.log("✅ Shop data stored successfully");
    
    return {
      shopsRow,
      shopsId: shopsRow.id,
      shopsBrandName: shopsRow.brandName || shopInfo.name
    };
    
  } catch (error) {
    console.error("❌ Failed to store shop data:", error);
    throw error; // Re-throw to handle in main flow
  }
}

export default function AuthRoute() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h2>🔐 Authenticating...</h2>
        <p>Connecting your shop to PROPHET...</p>
      </div>
    </div>
  );
}



/*
// app/routes/auth.$.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import  createClient  from "../utils/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== AUTH.$ START ===");
  console.log("Auth request URL:", request.url);

  try {
    // authenticate.admin handles both /auth and /auth/callback
    const { admin, session } = await authenticate.admin(request);

    console.log("Authentication successful:", {
      shop: session.shop,
      isOnline: session.isOnline,
      hasAccessToken: !!session.accessToken,
    });

    // Write shop + auth info into Supabase
    await storeShopAndAuth(session, admin);

    // Extract host param if present
    const url = new URL(request.url);
    const host = url.searchParams.get("host");

    // Redirect into app after success
    const appUrl = `/app?shop=${encodeURIComponent(session.shop)}${host ? `&host=${encodeURIComponent(host)}` : ""
      }`;
    console.log("Redirecting to app:", appUrl);

    return redirect(appUrl);
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      console.log("Redirecting to Shopify OAuth:", error.headers.get("location"));
      throw error; // normal OAuth redirect
    }
    console.error("Unexpected authentication error:", error);
    return redirect("/error?type=oauth_failed");
  }
}

// Store shop record and matching shopauth record
async function storeShopAndAuth(session: any, admin: any) {
  const supabase = createClient();

  try {
    console.log("Fetching shop info for:", session.shop);

    // Get shop info from Shopify REST API
    const shopResp = await admin.rest.resources.Shop.all({ session });
    if (!shopResp.data || shopResp.data.length === 0) {
      throw new Error("Could not fetch shop info from Shopify");
    }
    const shopInfo = shopResp.data[0];

    // 1. Upsert into shops
    const { data: shopRow, error: shopError } = await supabase
      .from("shops")
      .upsert(
        {
          shop_id: shopInfo.id, // Shopify's numeric ID
          shopDomain: session.shop,
          brand_name: shopInfo.name,
          company_legal_name: shopInfo.name,
          store_currency: shopInfo.currency,
          commerce_platform: "shopify",
          company_phone: shopInfo.phone || null,
          company_address: shopInfo.address1
            ? {
              address1: shopInfo.address1,
              address2: shopInfo.address2,
              city: shopInfo.city,
              province: shopInfo.province,
              country: shopInfo.country,
              zip: shopInfo.zip,
            }
            : null,
          created_date: new Date().toISOString(),
          modified_date: new Date().toISOString(),
        },
        { onConflict: "shopDomain" }
      )
      .select("id")
      .single();

    if (shopError) {
      console.error("Failed to upsert shop:", shopError);
      throw new Error("Shop upsert failed");
    }

    console.log("Shop stored with id:", shopRow.id);

    // 2. Upsert into shopauth
    const { error: authError } = await supabase.from("shopauth").upsert(
      {
        id: session.shop, // using domain as ID
        shop: shopRow.id, // FK to shops
        shop_id: shopInfo.id, // Shopify's numeric shop ID
        shop_name: shopInfo.name,
        access_token: session.accessToken,
        shopify_scope: session.scope,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        created_by: "oauth_callback",
      },
      { onConflict: "id" }
    );

    if (authError) {
      console.error("Failed to upsert shopauth:", authError);
      throw new Error("Shopauth upsert failed");
    }

    console.log("Shopauth stored successfully");
  } catch (err) {
    console.error("Error storing shop + auth in Supabase:", err);
  }
}

// Fallback UI
export default function AuthRoute() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fef3c7",
        border: "2px solid orange",
        fontFamily: "monospace",
        textAlign: "center",
      }}
    >
      <h1>Starting OAuth Flow...</h1>
      <p>Please wait while we redirect you to Shopify for authentication.</p>
    </div>
  );
}
*/