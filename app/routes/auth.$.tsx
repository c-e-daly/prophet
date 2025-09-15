import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Auth request URL:", request.url);
  
  try {
    const { admin, session } = await authenticate.admin(request);
    console.log("Shopify auth successful:", { 
      shop: session?.shop, 
      hasToken: !!session?.accessToken,
      scope: session?.scope 
    });
    
    if (!session?.shop || !session.accessToken) {
      throw new Error("Auth missing shop or token");
    }
    
    // Store/update shop data in your database
    await storeShopData(session, admin);
    console.log("Shop data stored successfully");
    
    // Simple redirect to app with required params
    const url = new URL(request.url);
    const host = url.searchParams.get("host");
    
    const params = new URLSearchParams();
    params.set("shop", session.shop);
    if (host) params.set("host", host);
    
    return redirect(`/app?${params.toString()}`);
    
  } catch (error) {
    console.error("Auth failed:", error);
    if (error instanceof Response && error.status === 302) throw error;
    return redirect("/app?error=auth_failed");
  }
}

async function storeShopData(session: any, admin: any) {
  const supabase = createClient();
  
  try {
    console.log("Fetching shop data from Shopify for:", session.shop);
    
    // Fetch shop data from Shopify
    const shopResponse = await admin.rest.resources.Shop.all({ session });
    console.log("Shop response:", { 
      hasData: !!shopResponse.data, 
      dataLength: shopResponse.data?.length 
    });
    
    const shopInfo = shopResponse.data?.[0];
    if (!shopInfo) {
      console.error("No shop info in response:", shopResponse);
      throw new Error("Could not fetch shop info from Shopify");
    }
    
    console.log("Shop info retrieved:", {
      id: shopInfo.id,
      name: shopInfo.name,
      domain: shopInfo.domain,
      myshopifyDomain: shopInfo.myshopify_domain
    });
    
    const now = new Date().toISOString();
    
    // Prepare shop data for upsert
    const shopData = {
      shopGID: shopInfo.id.toString(), // Ensure it's a string
      shopDomain: session.shop,
      brandName: shopInfo.name || session.shop,
      companyLegalName: shopInfo.name || session.shop,
      storeCurrency: shopInfo.currency || 'USD',
      commercePlatform: "shopify",
      companyPhone: shopInfo.phone || null,
      companyAddress: shopInfo.address1 ? {
        address1: shopInfo.address1,
        address2: shopInfo.address2 || null,
        city: shopInfo.city,
        province: shopInfo.province,
        country: shopInfo.country,
        zip: shopInfo.zip,
      } : null,
      createDate: now,
      modifiedDate: now,
    };
    
    console.log("Upserting shop data:", shopData);
    
    // Upsert shop data
    const { data: shopsRow, error: shopError } = await supabase
      .from("shops")
      .upsert(shopData, { onConflict: "shopDomain" })
      .select()
      .single();
    
    if (shopError) {
      console.error("Shop upsert error:", shopError);
      throw new Error(`Shop upsert failed: ${shopError.message}`);
    }
    
    if (!shopsRow) {
      console.error("No shop row returned from upsert");
      throw new Error("Shop upsert returned no data");
    }
    
    console.log("Shop upserted successfully:", { id: shopsRow.id, domain: shopsRow.shopDomain });
    
    // Prepare auth data for upsert
    const authData = {
      id: session.shop, // This should be the myshopify domain
      shops: shopsRow.id, // Foreign key to shops table
      shopGID: shopInfo.id.toString(),
      shopName: shopInfo.name || session.shop,
      accessToken: session.accessToken,
      shopifyScope: session.scope || '',
      createDate: now,
      modifiedDate: now,
      created_by: "oauth_callback",
    };
    
    console.log("Upserting auth data:", { 
      ...authData, 
      accessToken: "[REDACTED]" // Don't log the actual token
    });
    
    // Upsert auth data
    const { data: authRow, error: authError } = await supabase
      .from("shopauth")
      .upsert(authData, { onConflict: "id" })
      .select()
      .single();
    
    if (authError) {
      console.error("Auth upsert error:", authError);
      throw new Error(`Auth upsert failed: ${authError.message}`);
    }
    
    console.log("Auth upserted successfully:", { id: authRow.id });
    
    return { shop: shopsRow, auth: authRow };
    
  } catch (error) {
    console.error("Error in storeShopData:", error);
    throw error;
  }
}

export default function AuthRoute() {
  return null;
}

/* 
// app/auth.$.tsx - handle appbridge authenticate the shop and callback to get tokens
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Auth request URL:", request.url);
  
  try {
    const { admin, session } = await authenticate.admin(request);
    console.log("Shopify auth successful:", { shop: session?.shop, hasToken: !!session?.accessToken });
    
    if (!session?.shop || !session.accessToken) {
      throw new Error("Auth missing shop or token");
    }
    
    // Store/update shop data in your database
    await storeShopData(session, admin);
    console.log("Shop data stored successfully");
    
    // Simple redirect to app with required params
    const url = new URL(request.url);
    const host = url.searchParams.get("host");
    
    const params = new URLSearchParams();
    params.set("shop", session.shop);
    if (host) params.set("host", host);
    
    return redirect(`/app?${params.toString()}`);
    
  } catch (error) {
    console.error("Auth failed:", error);
    if (error instanceof Response && error.status === 302) throw error;
    return redirect("/app?error=auth_failed");
  }
}

async function storeShopData(session: any, admin: any) {
  const supabase = createClient();

  const shopResponse = await admin.rest.resources.Shop.all({ session });
  const shopInfo = shopResponse.data?.[0];
  if (!shopInfo) throw new Error("Could not fetch shop info");

  // Upsert shop data
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

  // Upsert auth data
  const { error: authError } = await supabase
    .from("shopauth")
    .upsert(
      {
        id: session.shop,
        shops: shopsRow.id,
        shopGID: shopInfo.id,
        shopName: shopInfo.name,
        accessToken: session.accessToken,
        shopifyScope: session.scope,
        createDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        created_by: "oauth_callback",
      },
      { onConflict: "id" }
    );

  if (authError) throw authError;
}

export default function AuthRoute() {
  return null;
}
*/