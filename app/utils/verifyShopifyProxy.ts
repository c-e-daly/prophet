// Node (Remix) helper to verify Shopify App Proxy requests
import crypto from "crypto";

export function verifyShopifyProxy(url: URL, secret: string): boolean {
  const provided = url.searchParams.get("signature") || url.searchParams.get("hmac");
  if (!provided || !secret) return false;

  // Build sorted query string excluding signature params
  const data = [...url.searchParams.entries()]
    .filter(([k]) => k !== "signature" && k !== "hmac")
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join("");

  const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");

  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Optional: throw on invalid signature except in dev */
export function assertShopifyProxy(url: URL, secret: string) {
  if (process.env.NODE_ENV === "development" && process.env.SHOPIFY_PROXY_BYPASS === "true") return;
  if (!verifyShopifyProxy(url, secret)) {
    throw new Response("Invalid proxy signature", { status: 401 });
  }
}
