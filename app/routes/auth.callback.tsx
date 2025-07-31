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

// Store shop credentials in Supabase
async function storeShopCredentials(shop: string, accessToken: string, scopes: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('shops')
    .upsert({
      shop_domain: shop,
      access_token: accessToken,
      scopes: scopes,
      installed_at: new Date().toISOString(),
      is_active: true,
    }, {
      onConflict: 'shop_domain'
    });

  if (error) {
    console.error('Error storing shop credentials:', error);
    throw new Error('Failed to store shop credentials');
  }
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