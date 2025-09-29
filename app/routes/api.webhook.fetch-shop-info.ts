// File: app/routes/api.webhook.fetch-shop-info.ts
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import createClient from "../../supabase/server";

// Type definitions
interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: number;
    shopId: number;
    shopDomain: string;
    lastFetchedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  schema: string;
  old_record: any;
}

const SHOP_BUSINESS_INFO_QUERY = `
  query getShopBusinessInfo {
    shop {
      id
      name
      email
      contactEmail
      customerEmail
      shopOwnerName
      description
      billingAddress {
        address1
        address2
        city
        province
        zip
        country
        firstName
        lastName
        company
        phone
      }
      myshopifyDomain
      primaryDomain {
        host
        url
      }
      plan {
        displayName
        partnerDevelopment
        shopifyPlus
      }
      currencyCode
      ianaTimezone
      createdAt
      updatedAt
    }
  }
`;

// Function to fetch shop info from Shopify API
async function fetchShopInfoFromShopify(shopDomain: string, accessToken: string) {
  const response = await fetch(`https://${shopDomain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: SHOP_BUSINESS_INFO_QUERY })
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.shop;
}

// Main webhook handler - Remix style
export const action = async ({ request }: ActionFunctionArgs) => {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();
  let shopDomain = 'unknown';
  const supabase = createClient();

  try {
    // Verify webhook secret for security
    const webhookSecret = request.headers.get('webhook-secret') || request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      console.log('❌ Unauthorized webhook attempt');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();
    const { type, table, record } = payload;

    console.log('🔗 Webhook received:', { 
      type, 
      table, 
      shopId: record?.shopId,
      shopDomain: record?.shopDomain,
      lastFetchedAt: record?.lastFetchedAt
    });

    // Only process INSERT events on shopBusinessInfo table where lastFetchedAt is null
    if (type === 'INSERT' && table === 'shopBusinessInfo' && !record.lastFetchedAt) {
      shopDomain = record.shopDomain;
      console.log(`🚀 Processing new shop: ${shopDomain}`);

      // Get the access token for this shop from shopauth table
      const { data: shopAuth, error: authError } = await supabase
        .from('shopauth')
        .select('accessToken, id')
        .eq('id', shopDomain)
        .single();

      if (authError || !shopAuth?.accessToken) {
        throw new Error(`No access token found for shop: ${shopDomain}`);
      }

      console.log(`📡 Fetching shop info from Shopify API for ${shopDomain}`);
      
      const shopInfo = await fetchShopInfoFromShopify(shopDomain, shopAuth.accessToken);
      
      console.log(`📝 Updating shopBusinessInfo table for ${shopDomain}`);

      // Update shopBusinessInfo table
      const { error: updateBusinessInfoError } = await supabase
        .from('shopBusinessInfo')
        .update({
          legalName: shopInfo.billingAddress?.company || shopInfo.name,
          companyName: shopInfo.billingAddress?.company,
          brandName: shopInfo.name,
          shopOwnerName: shopInfo.shopOwnerName,
          shopOwnerEmail: shopInfo.email,
          contactEmail: shopInfo.contactEmail,
          customerEmail: shopInfo.customerEmail,
          billingAddress1: shopInfo.billingAddress?.address1,
          billingAddress2: shopInfo.billingAddress?.address2,
          billingCity: shopInfo.billingAddress?.city,
          billingProvince: shopInfo.billingAddress?.province,
          billingZip: shopInfo.billingAddress?.zip,
          billingCountry: shopInfo.billingAddress?.country,
          billingPhone: shopInfo.billingAddress?.phone,
          planName: shopInfo.plan?.displayName,
          currencyCode: shopInfo.currencyCode,
          timezone: shopInfo.ianaTimezone,
          shopCreatedAt: shopInfo.createdAt,
          lastFetchedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('shopId', record.shopId);

      if (updateBusinessInfoError) {
        throw new Error(`shopBusinessInfo update failed: ${updateBusinessInfoError.message}`);
      }

      console.log(`📝 Updating shops table for ${shopDomain}`);

      // Update shops table with Shopify shop ID, currency, brandName, and shopAuth reference
      const { error: updateShopsError } = await supabase
        .from('shops')
        .update({
          shopGID: shopInfo.id, // Shopify shop.id (e.g., "gid://shopify/Shop/12345678")
          storeCurrency: shopInfo.currencyCode,
          brandName: shopInfo.name,
          shopAuth: shopAuth.id, // Reference to shopauth.id (shop domain)
          modifiedDate: new Date().toISOString()
        })
        .eq('id', record.shopId);

      if (updateShopsError) {
        throw new Error(`shops table update failed: ${updateShopsError.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Successfully processed ${shopDomain} in ${duration}ms`);
      console.log(`   - Updated shopBusinessInfo with detailed info`);
      console.log(`   - Updated shops with shopGID: ${shopInfo.id}`);
      console.log(`   - Updated shops with currency: ${shopInfo.currencyCode}`);
      console.log(`   - Updated shops with brandName: ${shopInfo.name}`);
      console.log(`   - Linked shops.shopAuth to shopauth.id: ${shopAuth.id}`);
      
      return json({ 
        success: true, 
        shopDomain,
        shopGID: shopInfo.id,
        currency: shopInfo.currencyCode,
        brandName: shopInfo.name,
        processingTime: duration,
        message: `Shop info fetched and stored for ${shopDomain}`
      });
    }

    // Acknowledge webhook but don't process
    console.log('⏭️ Webhook received but skipped (not a new shop needing processing)');
    return json({ 
      success: true, 
      skipped: true,
      reason: 'Not a new shop or already processed'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Webhook processing failed for ${shopDomain} after ${duration}ms:`, error);
    
    // Log the error to your database for debugging (optional)
    try {
      await supabase.from('trigger_debug').insert({
        triggerName: 'webhook_shop_info_fetch',
        message: 'WEBHOOK_ERROR',
        sessionData: {
          shopDomain,
          error: errorMessage,
          processingTime: duration,
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return json({ 
      error: 'Internal server error',
      shopDomain,
      details: errorMessage,
      processingTime: duration
    }, { status: 500 });
  }
};