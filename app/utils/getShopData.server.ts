// app/lib/utils/getShopData.server.ts
// app/lib/utils/getShopData.server.ts
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";
import type { CompleteShopSession } from "../../app//lib//types/shopSession";
import type { Database } from "../../supabase/database.types"; // e.g. "~/types/database.types"

type ShopsRow = Database["public"]["Tables"]["shops"]["Row"];
type ProxyShopContext = {
  shopDomain: string;
  shopName: string;
  shopsID: number;
  shopsBrandName: string;
  accessToken: string; // Admin API token for GraphQL
};

// Shared DB lookup used by both helpers
async function getShopByDomain(shopDomain: string): 
Promise<{ shopsRow: ShopsRow; accessToken: string }>{
  const supabase = createClient();

  const { data: shopsRow, error: e1 } = await supabase
    .from("shops")
    .select("*")
    .eq("shopDomain", shopDomain)
    .maybeSingle();
  if (e1 || !shopsRow?.id) throw new Error("Shop not found in database");

  const { data: authRow, error: e2 } = await supabase
    .from("shopauth")
    .select("accessToken")
    .eq("shops", shopsRow.id)
    .maybeSingle();
  if (e2 || !authRow?.accessToken) throw new Error("Access token missing for shop");

  return { shopsRow, accessToken: authRow.accessToken as string };
}

/** Admin (embedded app) helper — uses authenticate.admin */
export async function getShopData(request: Request): Promise<CompleteShopSession> {
  const { session } = await authenticate.admin(request);
  if (!session?.shop) throw new Error("No shop session found");

  const { shopsRow, accessToken } = await getShopByDomain(session.shop);

  return {
    shopDomain: session.shop,
    shopName: session.shop.replace(".myshopify.com", ""),
    hasToken: !!session.accessToken,
    shops: shopsRow,
    shopsID: shopsRow.id,
    shopsBrandName: shopsRow.brandName ?? "",
  };
}

/** App Proxy (storefront → proxy) helper — NO authenticate.admin */
export async function getShopDataFromProxy(input: Request | URL): Promise<ProxyShopContext> {
  const url = input instanceof URL ? input : new URL(input.url);
  const shopDomain = url.searchParams.get("shop");
  if (!shopDomain) throw new Error("Missing 'shop' param on proxy request");

  const { shopsRow, accessToken } = await getShopByDomain(shopDomain);
  return {
    shopDomain,
    shopName: shopDomain.replace(".myshopify.com", ""),
    shopsID: shopsRow.id as number,
    shopsBrandName: shopsRow.brandName ?? "",
    accessToken,
  };
}

// Optional alias if you prefer this name:
export const getShopDataProxy = getShopDataFromProxy;


/*
import { authenticate } from "../shopify.server";
import createClient from "../../supabase/server";
import type { CompleteShopSession } from "../../app//lib//types/shopSession";

export async function getShopData(request: Request): Promise<CompleteShopSession> {
  const { session } = await authenticate.admin(request);
  
  if (!session?.shop) {
    throw new Error("No shop session found");
  }

  const supabase = createClient();
  
  // Get shop data from your database
  const { data: shopsRow, error } = await supabase
    .from("shops")
    .select("*")
    .eq("shopDomain", session.shop)
    .single();

  if (error || !shopsRow) {
    throw new Error("Shop not found in database");
  }

  return {
    shopDomain: session.shop,
    shopName: session.shop.replace(".myshopify.com", ""),
    hasToken: !!session.accessToken,
    shops: shopsRow,
    shopsID: shopsRow.id,
    shopsBrandName: shopsRow.brandName ?? '',
  };
}
  */