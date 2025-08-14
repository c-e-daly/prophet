import { serve } from "https://deno.land/std/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("OAuth callback params:", {
    shop,
    code: code ? "present" : "missing",
    state,
  });

  if (!shop || !code) {
    return jsonResponse({ error: "Missing shop or authorization code" }, 400);
  }

  // Optional: Validate state for CSRF protection
  if (state) {
    const { data: stateRecord } = await supabase
      .from("oauth_states")
      .select("shop_id, expires_at")
      .eq("state", state)
      .single();

    if (!stateRecord) {
      return jsonResponse({ error: "Invalid state parameter" }, 400);
    }

    const expired = new Date(stateRecord.expires_at) < new Date();
    await supabase.from("oauth_states").delete().eq("state", state);

    if (expired) {
      return jsonResponse({ error: "Authorization request has expired" }, 400);
    }
  }

  const apiKey = Deno.env.get("SHOPIFY_CLIENT_ID");
  const apiSecretKey = Deno.env.get("SHOPIFY_CLIENT_SECRET");

  if (!apiKey || !apiSecretKey) {
    return jsonResponse({ error: "Missing Shopify credentials" }, 500);
  }

  try {
    // 1. Exchange code for access token - FIXED REQUEST FORMAT
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        client_id: apiKey, 
        client_secret: apiSecretKey, 
        code 
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return jsonResponse({ error: "Failed to exchange authorization code", details: errorText }, 500);
    }

    const tokenData = await tokenResponse.json();
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      return jsonResponse({ error: "No access token received from Shopify" }, 500);
    }

    // 2. Fetch shop details - UPDATED API VERSION
    const shopResponse = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!shopResponse.ok) {
      const errorText = await shopResponse.text();
      console.error("Failed to fetch shop info:", errorText);
      return jsonResponse({ error: "Failed to fetch shop information" }, 500);
    }

    const shopDetails = await shopResponse.json();
    const shopifyGID = shopDetails.shop?.id ?? null;
    const shopName = shopDetails.shop?.name ?? null;

    // 3. Create or fetch shop record
    let { data: existingShop } = await supabase
      .from("shops")
      .select("id")
      .eq("store_url", shop)
      .single();

    if (!existingShop) {
      const { data: newShop, error: insertError } = await supabase
        .from("shops")
        .insert([{ store_url: shop }])
        .select("id")
        .single();

      if (insertError || !newShop) {
        return jsonResponse({ error: "Failed to create shop record" }, 500);
      }

      existingShop = newShop;
    }

    const shopId = existingShop.id;

    // 4. Insert or update auth record - FIXED TABLE NAME
    const { data: existingAuth } = await supabase
      .from("shopauth")  // Changed from "shopAuths" to "shopauth"
      .select("id")
      .eq("shop_id", shopId)
      .single();

    const authPayload = {
      shop_id: shopId,
      access_token: accessToken,
      shopify_scope: tokenData.scope,
      installed_at: new Date().toISOString(),
      shopify_gid: shopifyGID ? `gid://shopify/Shop/${shopifyGID}` : null,
      shop_name: shopName,
    };

    if (existingAuth) {
      const { error: updateError } = await supabase
        .from("shopauth")  // Changed from "shopAuths" to "shopauth"
        .update(authPayload)
        .eq("id", existingAuth.id);

      if (updateError) {
        console.error("Failed to update shopauth:", updateError.message);
        return jsonResponse({ error: "Failed to update authorization record" }, 500);
      }
    } else {
      const { error: insertError } = await supabase
        .from("shopauth")  // Changed from "shopAuths" to "shopauth"
        .insert([authPayload]);

      if (insertError) {
        console.error("Failed to insert into shopauth:", insertError.message);
        return jsonResponse({ error: "Failed to create authorization record" }, 500);
      }
    }

    console.log("✅ Shop authorization completed successfully");

    // 5. Redirect to Shopify Admin
    const appHandle = Deno.env.get("SHOPIFY_ADMIN_APP_HANDLE");
    const redirectUrl = `https://admin.shopify.com/store/${shop}/apps/${appHandle}?shop=${shop}&installed=true`;

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });

  } catch (error: any) {
    console.error("❌ OAuth callback error:", error);
    return jsonResponse({ error: "Authentication failed", message: error.message }, 500);
  }
});

// ✅ JSON response utility
function jsonResponse(obj: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}