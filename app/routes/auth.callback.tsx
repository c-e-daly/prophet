// app/routes/auth.callback.tsx - Handles OAuth callback
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import { authenticate } from "../utils/shopify/shopify.server"; // Updated import path
import { createClient } from "../utils/supabase/server"; // Static import

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== AUTH.CALLBACK START ===");
  console.log("Callback URL:", request.url);
  
  try {
    // Handle the OAuth callback
    const { admin, session } = await authenticate.admin(request);
    
    console.log("OAuth callback successful:", {
      shop: session.shop,
      isOnline: session.isOnline,
      hasAccessToken: !!session.accessToken
    });
    
    // Store shop data in Supabase after successful OAuth
    await storeShopDataAfterAuth(session, admin);
    
    // Extract URL parameters for redirect
    const url = new URL(request.url);
    const host = url.searchParams.get("host");
    
    // Redirect to main app
    const appUrl = `/app?shop=${encodeURIComponent(session.shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`;
    console.log("Redirecting to app:", appUrl);
    
    return redirect(appUrl);
    
  } catch (error) {
    console.error("OAuth callback error:", error);
    
    // If callback fails, redirect to error page
    return redirect("/error?type=oauth_failed");
  }
}

// Store shop data in Supabase after successful OAuth
async function storeShopDataAfterAuth(session: Session, admin: any) {
  try {
    const supabase = createClient();
    
    console.log("Storing shop data after OAuth:", session.shop);
    
    // Get shop info from Shopify Admin API if needed
    let shopData: any = {
      id: session.shop,
      storeurl: session.shop,
      shop_domain: session.shop,
      access_token: session.accessToken,
      updated_at: new Date().toISOString()
    };
    
    // Optionally fetch additional shop details from Shopify
    try {
      const shopInfo = await admin.rest.resources.Shop.all({
        session
      });
      
      if (shopInfo.data && shopInfo.data.length > 0) {
        const shop = shopInfo.data[0];
        shopData = {
          ...shopData,
          shop_name: shop.name,
          shop_email: shop.email,
          shop_owner: shop.shop_owner,
          currency: shop.currency,
          timezone: shop.timezone,
          country: shop.country_name,
          plan_name: shop.plan_name
        };
      }
    } catch (shopInfoError) {
      console.warn("Could not fetch additional shop info:", shopInfoError);
    }
    
    // Upsert shop data
    const { error } = await supabase
      .from('shops')
      .upsert(shopData, {
        onConflict: 'id'
      });
      
    if (error) {
      console.error("Failed to store shop data:", error);
    } else {
      console.log("Shop data stored successfully");
    }
    
  } catch (error) {
    console.error("Error in storeShopDataAfterAuth:", error);
  }
}

// This should not render in normal flow
export default function AuthCallback() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#dcfce7', 
      border: '2px solid green',
      fontFamily: 'monospace',
      textAlign: 'center'
    }}>
      <h1>✅ Authentication Complete!</h1>
      <p>Redirecting you to your app...</p>
      <p>If you're not redirected automatically, please refresh the page.</p>
    </div>
  );
}



/*
// app/routes/auth.callback.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import crypto from "crypto";
import { createClient } from '@supabase/supabase-js';

// Exchange authorization code for access token
async function exchangeCodeForToken(shop: string, code: string) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: process.env.SHOPIFY_CLIENT_ID as string,
      apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET as string,
      code: code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

// Get shop info from Shopify API
async function getShopInfo(shop: string, accessToken: string) {
  const response = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get shop info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.shop;
}

// Store shop credentials in Supabase
async function storeShopCredentials(shop: string, accessToken: string, scopes: string) {
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
  });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First get shop details from Shopify API
  const shopInfo = await getShopInfo(shop, accessToken);
  console.log('Shop info retrieved:', {
    id: shopInfo.id,
    name: shopInfo.name,
    domain: shopInfo.myshopify_domain
  });

  // 1. Upsert shop record
  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .upsert({
      shop_id: shopInfo.id, // Shopify's shop ID
      store_url: shop,
      brand_name: shopInfo.name,
      company_legal_name: shopInfo.name,
      store_currency: shopInfo.currency,
      commerce_platform: 'shopify',
      company_phone: shopInfo.phone || null,
      company_address: shopInfo.address1 ? {
        address1: shopInfo.address1,
        address2: shopInfo.address2,
        city: shopInfo.city,
        province: shopInfo.province,
        country: shopInfo.country,
        zip: shopInfo.zip
      } : null,
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
    }, {
      onConflict: 'store_url'
    })
    .select('id')
    .single();

  if (shopError) {
    console.error('Error storing shop:', shopError);
    throw new Error('Failed to store shop data');
  }

  console.log('Shop stored with internal ID:', shopData.id);

  // 2. Upsert shopAuth record (CRITICAL: always update access token)
  const { error: authError } = await supabase
    .from('shopauth')
    .upsert({
      id: shop, // Use shop domain as ID
      shop: shopData.id, // Reference to shops table
      shop_id: shopInfo.id, // Shopify's shop ID for easy joining
      shop_name: shopInfo.name,
      access_token: accessToken, // NEW TOKEN - critical to update!
      shopify_scope: scopes,
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      created_by: 'oauth_callback'
    }, {
      onConflict: 'id'
    });

  if (authError) {
    console.error('Error storing shop auth:', authError);
    throw new Error('Failed to store shop auth data');
  }

  console.log('Shop auth stored successfully');
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("=== OAUTH CALLBACK ===");
  console.log("Full callback URL:", request.url);

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const hmac = url.searchParams.get('hmac');
  const host = url.searchParams.get('host'); // CRITICAL: Extract host from Shopify

  console.log("All callback params:", {
    code: code ? `${code.substring(0, 10)}...` : null,
    shop,
    state: state ? `${state.substring(0, 10)}...` : null,
    error,
    hmac: hmac ? `${hmac.substring(0, 10)}...` : null,
    host, // Log the host parameter
    allParams: Object.fromEntries(url.searchParams.entries())
  });

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return redirect(`/?error=oauth_denied`);
  }

  // Validate required parameters
  if (!code || !shop) {
    console.error("Missing required parameters - code:", !!code, "shop:", !!shop);
    console.log("Redirecting to home with missing_params error");
    return redirect(`/?error=missing_params`);
  }

  // Validate shop domain
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    console.error("Invalid shop domain:", shop);
    return redirect(`/?error=invalid_shop`);
  }

  try {
    // Exchange authorization code for access token
    console.log('Starting token exchange...');
    const tokenData = await exchangeCodeForToken(shop, code);
    console.log("Token exchange successful:", {
      hasAccessToken: !!tokenData.access_token,
      scopes: tokenData.scope
    });

    // Store credentials in Supabase
    console.log('Starting credential storage...');
    await storeShopCredentials(shop, tokenData.access_token, tokenData.scope);
    console.log("Shop credentials stored successfully");

    // CRITICAL: Use the host parameter that Shopify sent us
    if (!host) {
      console.error('No host parameter received from Shopify');
      return redirect(`/?shop=${shop}&error=missing_host`);
    }

    // Add 'installed' parameter to prevent redirect loops
    const redirectUrl = `/?shop=${shop}&host=${encodeURIComponent(host)}&installed=true`;
    console.log('Redirecting to app:', redirectUrl);
    console.log('Shop param for redirect:', shop);
    console.log('Host param for redirect (from Shopify):', host);

    return redirect(redirectUrl);

  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirect(`/?error=oauth_failed&shop=${shop}`);
  }
};

*/