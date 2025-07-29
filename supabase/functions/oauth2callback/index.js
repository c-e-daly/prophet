import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(Deno.env.get("NEXT_PUBLIC_SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
serve(async (req)=>{
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  console.log("OAuth callback params:", {
    shop,
    code: code ? "present" : "missing",
    state
  });
  if (!shop || !code) {
    return new Response(JSON.stringify({
      error: "Missing shop or authorization code"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  // Validate state parameter (optional but recommended for security)
  if (state) {
    const { data: stateRecord } = await supabase.from("oauth_states").select("shop_id, expires_at").eq("state", state).single();
    if (!stateRecord) {
      return new Response(JSON.stringify({
        error: "Invalid state parameter"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Check if state has expired
    if (new Date(stateRecord.expires_at) < new Date()) {
      // Clean up expired state
      await supabase.from("oauth_states").delete().eq("state", state);
      return new Response(JSON.stringify({
        error: "Authorization request has expired"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Clean up used state
    await supabase.from("oauth_states").delete().eq("state", state);
  }
  const clientId = Deno.env.get("SHOPIFY_CLIENT_ID_DEV");
  const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET_DEV");
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({
      error: "Missing Shopify credentials"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // 1. Exchange code for access token
    console.log("Exchanging code for access token...");
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return new Response(JSON.stringify({
        error: "Failed to exchange authorization code",
        details: errorText
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({
        error: "No access token received from Shopify"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log("Access token received, fetching shop details...");
    // 2. Fetch shop details to get the Shopify GID
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });
    if (!shopResponse.ok) {
      console.error("Failed to fetch shop info:", await shopResponse.text());
      return new Response(JSON.stringify({
        error: "Failed to fetch shop information"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const shopDetails = await shopResponse.json();
    const shopifyGID = shopDetails.shop?.id || null;
    const shopName = shopDetails.shop?.name || null;
    console.log("Shop details fetched:", {
      shopName,
      shopifyGID
    });
    // 3. Look up or create shop record in Supabase
    let { data: existingShop, error: shopFetchError } = await supabase.from("shops").select("id").eq("store_url", shop).single();
    if (shopFetchError || !existingShop) {
      console.log("Shop not found, creating new shop record...");
      // Create shop record if it doesn't exist
      const { data: newShop, error: createError } = await supabase.from("shops").insert([
        {
          store_url: shop
        }
      ]).select("id").single();
      if (createError || !newShop) {
        console.error("Failed to create shop record:", createError?.message);
        return new Response(JSON.stringify({
          error: "Failed to create shop record"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
      existingShop = newShop;
    }
    const shopId = existingShop.id;
    // 4. Check if auth record already exists (handle re-installs)
    const { data: existingAuth } = await supabase.from("shopAuths").select("id").eq("shop_id", shopId).single();
    if (existingAuth) {
      console.log("Updating existing auth record...");
      // Update existing auth record
      const { error: updateError } = await supabase.from("shopAuths").update({
        access_token: accessToken,
        shopify_scope: tokenData.scope,
        installed_at: new Date().toISOString(),
        shopify_gid: shopifyGID ? `gid://shopify/Shop/${shopifyGID}` : null,
        shop_name: shopName
      }).eq("id", existingAuth.id);
      if (updateError) {
        console.error("Failed to update shopAuths:", updateError.message);
        return new Response(JSON.stringify({
          error: "Failed to update authorization record"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    } else {
      console.log("Creating new auth record...");
      // Create new auth record
      const { error: insertError } = await supabase.from("shopAuths").insert([
        {
          shop_id: shopId,
          access_token: accessToken,
          shopify_scope: tokenData.scope,
          installed_at: new Date().toISOString(),
          shopify_gid: shopifyGID ? `gid://shopify/Shop/${shopifyGID}` : null,
          shop_name: shopName
        }
      ]);
      if (insertError) {
        console.error("Failed to insert into shopAuths:", insertError.message);
        return new Response(JSON.stringify({
          error: "Failed to create authorization record"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    }
    console.log("✅ Shop authorization completed successfully");
    // Redirect to your app with success
    const appUrl = Deno.env.get("SHOPIFY_APP_URL") || "https://your-app.com";
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/dashboard?shop=${shop}&installed=true`
      }
    });
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    return new Response(JSON.stringify({
      error: "Authentication failed",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
