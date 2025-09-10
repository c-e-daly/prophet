// app/routes/auth.$.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import createClient from "../utils/supabase/server";
import { setShopSessionInStorage } from "../lib/session/shopSession.server";
import type { CompleteShopSession } from "../lib/types/shopSession";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Shopify OAuth / session
    const { admin, session } = await authenticate.admin(request);
    if (!session?.shop || !session.accessToken) throw new Error("Auth missing shop or token");

    // Persist/update shop + auth in Supabase
    const { shopsRow, shopsId, shopsBrandName } = await storeShopData(session, admin);

    // Build a COMPLETE session (no partials)
    const completeSession: CompleteShopSession = {
      shopDomain: session.shop,
      shopName: session.shop.replace(".myshopify.com", ""),
      hasToken: true,
      shops: shopsRow,           // full row if your type expects it
      shopsID: shopsRow.id,         // use exact casing your app expects
      shopsBrandName: shopsBrandName,
      shopsGID: shopsRow.shopGID
    };

    const cookie = await setShopSessionInStorage(request, completeSession);

    // Preserve host for embedded
    const url = new URL(request.url);
    const host = url.searchParams.get("host");

    const appUrl = `/app?shop=${encodeURIComponent(session.shop)}${host ? `&host=${encodeURIComponent(host)}` : ""}`;
    return redirect(appUrl, { headers: { "Set-Cookie": cookie } });

  } catch (error) {
    // If OAuth needs to redirect (302), let it through
    if (error instanceof Response && error.status === 302) throw error;
    console.error("❌ Auth failed:", error);
    return redirect("/app?error=auth_failed");
  }
}

async function storeShopData(session: any, admin: any) {
  const supabase = createClient();

  // Fetch shop info from Shopify Admin REST
  const shopResponse = await admin.rest.resources.Shop.all({ session });
  const shopInfo = shopResponse.data?.[0];
  if (!shopInfo) throw new Error("Could not fetch shop info");

  // Upsert into shops (match your actual camelCase columns)
  const { data: shopsRow, error: shopError } = await supabase
    .from("shops")
    .upsert(
      {
        shopGID: shopInfo.id,
        shopDomain: session.shop,
        brandName: shopInfo.name,
        companyLegalName: shopInfo.name,
        storeCurrency: shopInfo.currency,
        commercePlatform: "shopify",
        companyPhone: shopInfo.phone || null,
        companyAddress: shopInfo.address1
          ? {
              address1: shopInfo.address1,
              address2: shopInfo.address2,
              city: shopInfo.city,
              province: shopInfo.province,
              country: shopInfo.country,
              zip: shopInfo.zip,
            }
          : null,
        createDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
      },
      { onConflict: "shopDomain" }
    )
    .select()
    .single();

  if (shopError || !shopsRow) {
    console.error("Shop upsert failed:", shopError);
    throw new Error("Shop upsert failed");
  }

  // Upsert into shopauth (align column names to your table)
  const { error: authError } = await supabase
    .from("shopauth")
    .upsert(
      {
        id: session.shop,
        shop: shopsRow.id,
        shopGID: shopInfo.id,
        shopName: shopInfo.name, // rename to camelCase if your schema is camel here too
        accessToken: session.accessToken,
        shopifyScope: session.scope,
        createDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        created_by: "oauth_callback",
      },
      { onConflict: "id" }
    );

  if (authError) throw authError;

  return {
    shopsRow,
    shopsId: shopsRow.id,
    shopsBrandName: shopsRow.brandName ?? shopInfo.name,
  };
}

export default function AuthRoute() {
  return null; // never rendered; loader handles redirects
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