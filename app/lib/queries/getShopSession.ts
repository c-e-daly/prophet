//app/lib/queries/getShopSessiont.ts
// a library utility query that collects the Shopify GID, then shdops.id
// from Supabaase and uses the shops.id to query all other tables on shop reference

import { createClient } from "@supabase/supabase-js";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../utils/shopify/shopify.server"; // already in your app

// Use Supabase Service Role key (server-side only!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getShopSession(request: LoaderFunctionArgs["request"]) {
  // ✅ Step 1: Authenticate via Shopify session
  const { session } = await authenticate.admin(request);
  if (!session) {
    throw new Error("No valid Shopify session found");
  }

  const shopDomain = session.shop;
  if (!shopDomain) {
    throw new Error("Missing shop domain in session");
  }

  // ✅ Step 2: Resolve internal shop ID from Supabase
  const { data: shopData, error } = await supabase
    .from("shops")
    .select("id, store_url, brand_name")
    .eq("store_url", shopDomain)
    .single();

  if (error || !shopData) {
    console.error("Failed to resolve shop in Supabase:", error);
    throw new Error("Shop not found in Supabase");
  }

  return {
    shopId: shopData.id,
    shopDomain: shopData.store_url,
    brandName: shopData.brand_name,
  };
}
