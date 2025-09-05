// app/lib/queries/getShopSession.ts
import type { ShopsRow, CompleteShopSession } from "../../types/shopSession";

/** Heuristics to detect App Bridge heartbeat / background fetches */
function isLikelyHeartbeat(req: Request) {
  const h = req.headers;
  const fetchDest = h.get("Sec-Fetch-Dest");   // "empty" for XHR/fetch
  const fetchMode = h.get("Sec-Fetch-Mode");   // "cors" for XHR/fetch
  const xrw = h.get("X-Requested-With");       // "XMLHttpRequest" if present
  const accept = h.get("Accept");              // often "*/*" on pings
  // These aren’t perfect, but together they’re good enough to avoid noisy throws
  const looksLikeXHR = xrw === "XMLHttpRequest";
  const looksLikeCORSFetch = fetchDest === "empty" && fetchMode === "cors";
  const veryGenericAccept = accept === "*/*";
  return looksLikeXHR || looksLikeCORSFetch || veryGenericAccept;
}

/** Try to infer the shop domain from params/headers if Shopify session is missing */
function inferShopFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const headerShop = request.headers.get("X-Shopify-Shop-Domain");
  if (headerShop) return headerShop;

  // host is base64 of "{shop}.myshopify.com/admin"
  const host = url.searchParams.get("host");
  if (host) {
    try {
      const decoded = Buffer.from(host, "base64").toString("utf8");
      const match = decoded.match(/^([^/]+)\.myshopify\.com/);
      if (match?.[0]) return match[0];
    } catch {}
  }
  return null;
}

type GetShopSessionOpts = {
  /** Allow unauthenticated heartbeats to pass without throwing (default true). */
  allowUnauthedPings?: boolean;
};

export async function getShopSession(
  request: Request,
  opts: GetShopSessionOpts = { allowUnauthedPings: true }
): Promise<CompleteShopSession | null> {
  const { authenticate } = await import("../../../utils/shopify/shopify.server");
  const { createClient } = await import("../../../utils/supabase/server");

  const heartbeat = isLikelyHeartbeat(request);

  // 1) Try Shopify auth first (happy path)
  let shopDomain: string | null = null;
  let hasToken = false;

  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) {
      shopDomain = session.shop;
      hasToken = !!session.accessToken;
    }
  } catch {
    // Don’t throw on heartbeats; we’ll fall back to inference below.
    if (!heartbeat || opts.allowUnauthedPings === false) {
      // For real page loads, rethrow to bubble up a redirect to /auth.
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  // 2) Fallbacks for missing session on background pings
  if (!shopDomain) {
    shopDomain = inferShopFromRequest(request);
    if (!shopDomain) {
      if (heartbeat && opts.allowUnauthedPings !== false) {
        // Quietly signal “no session yet” to the caller
        return null;
      }
      // For real navigations, be strict
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  const shopName = shopDomain.replace(".myshopify.com", "");

  // 3) Load your shop row (quietly return null on heartbeat if not found)
  const supabase = createClient();
  const { data: shops, error } = await supabase
    .from("shops")
    .select("*")
    .eq("shopDomain", shopDomain)
    .single();

  if (error || !shops) {
    if (heartbeat && opts.allowUnauthedPings !== false) {
      return null;
    }
    throw new Response(`Shop not found in DB for ${shopDomain}`, { status: 404 });
  }

  return {
    shopDomain,
    shopName,
    hasToken,
    shops: shops as ShopsRow,
    shopsId: shops.id,
    shopsBrandName: shops.brandName ?? shopName,
  };
}

// (optional) re-export your types
export type { ShopSession, PartialShopSession, CompleteShopSession, ShopsRow } from "../../types/shopSession";


/*
// app/lib/queries/getShopSession.ts - UPDATED to match new types
import type { ShopsRow, CompleteShopSession } from "../types/shopSession";

export async function getShopSession(request: Request): Promise<CompleteShopSession> {
  const { authenticate } = await import("../../utils/shopify/shopify.server");
  const { createClient } = await import("../../utils/supabase/server");

  // From Shopify
  const { session } = await authenticate.admin(request);
  if (!session?.shop) throw new Response("Unauthorized", { status: 401 });
  const shopDomain = session.shop;
  const shopName = shopDomain.replace(".myshopify.com", "");
  const hasToken = !!session.accessToken;

  // From Supabase
  const supabase = createClient();
  const { data: shops, error } = await supabase
    .from("shops")
    .select("*")
    .eq("shopDomain", shopDomain)
    .single();

  if (error || !shops) {
    throw new Response(`Shop not found in DB for ${shopDomain}`, { status: 404 });
  }

  return {
    shopDomain,
    shopName,
    hasToken,
    shops,
    shopsId: shops.id,
    shopsBrandName: shops.brandName ?? shopName,
  };
}

// Re-export types for convenience
export type { ShopSession, PartialShopSession, CompleteShopSession, ShopsRow } 
from "../types/shopSession";

*/