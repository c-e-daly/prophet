// app/routes/auth.callback.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import crypto from "crypto";
import { createClient } from '@supabase/supabase-js';

// Validate HMAC signature from Shopify
function validateHmac(query: URLSearchParams, secret: string): boolean {
  const hmac = query.get('hmac');
  if (!hmac) return false;

  // Remove hmac and signature from query for validation
  const queryClone = new URLSearchParams(query);
  queryClone.delete('hmac');
  queryClone.delete('signature');

  // Sort parameters and create query string
  const sortedParams = Array.from(queryClone.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Generate HMAC
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(calculatedHmac, 'hex')
  );
}

// Exchange authorization code for access token
async function exchangeCodeForToken(shop: string, code: string) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
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

  // 1. Insert/update shop record
  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .upsert({
      shop_id: shopInfo.id, // Shopify's shop ID
      store_url: `https://${shop}`,
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
      onConflict: 'shop_id',
      ignoreDuplicates: false
    })
    .select('id')
    .single();

  if (shopError) {
    console.error('Error storing shop:', shopError);
    throw new Error('Failed to store shop data');
  }

  console.log('Shop stored with internal ID:', shopData.id);

  // 2. Insert/update shopAuth record
  const { error: authError } = await supabase
    .from('shopAuth')
    .upsert({
      id: shop, // Use shop domain as ID
      shop: shopData.id, // Reference to shops table
      shop_id: shopInfo.id, // Shopify's shop ID for easy joining
      shop_name: shopInfo.name,
      access_token: accessToken,
      shopify_scope: scopes,
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      created_by: 'oauth_callback'
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    });

  if (authError) {
    console.error('Error storing shop auth:', authError);
    throw new Error('Failed to store shop auth data');
  }

  console.log('Shop auth stored successfully');
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("=== OAUTH CALLBACK ===");
  
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  console.log("Callback params:", { code: !!code, shop, state, error });

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return redirect(`/?error=oauth_denied`);
  }

  // Validate required parameters
  if (!code || !shop) {
    console.error("Missing required parameters");
    return redirect(`/?error=missing_params`);
  }

  // Validate shop domain
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    console.error("Invalid shop domain:", shop);
    return redirect(`/?error=invalid_shop`);
  }

  try {
    // Validate HMAC signature
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error("SHOPIFY_CLIENT_SECRET not configured");
    }

    if (!validateHmac(url.searchParams, clientSecret)) {
      console.error("Invalid HMAC signature");
      return redirect(`/?error=invalid_signature`);
    }

    console.log("HMAC validation passed");

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(shop, code);
    console.log("Token exchange successful:", {
      hasAccessToken: !!tokenData.access_token,
      scopes: tokenData.scope
    });

    // Store credentials in Supabase
    await storeShopCredentials(shop, tokenData.access_token, tokenData.scope);
    console.log("Shop credentials stored successfully");

    // Optional: Create/update shop session for immediate use
    // You might want to create a session here for the embedded app

    // Redirect to the embedded app
    return redirect(`/?shop=${shop}&host=${btoa(`${shop}/admin`)}`);

  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirect(`/?error=oauth_failed&shop=${shop}`);
  }
};