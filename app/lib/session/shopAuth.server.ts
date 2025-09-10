// app/lib/session/shopAuth.server.ts
import { redirect } from "@remix-run/node";
import { getShopSessionFromStorage, setShopSessionInStorage } from "./shopSession.server";
import { isCompleteShopSession, type CompleteShopSession } from "../types/shopSession";
import { authenticate } from "../../utils/shopify/shopify.server";

/**
 * Require a COMPLETE shop session.
 * If we already have it in cookie -> return it.
 * Otherwise, authenticate with Shopify and rebuild from Supabase (via callback).
 * If still not possible -> redirect to /auth.
 */
export async function requireShopSession(request: Request): Promise<{
  shopSession: CompleteShopSession;
  headers?: { "Set-Cookie": string };
}> {
  // 1. Check cookie
  const existing = await getShopSessionFromStorage(request);
  if (existing && isCompleteShopSession(existing)) {
    return { shopSession: existing as CompleteShopSession };
  }

  // 2. Try to authenticate with Shopify
  try {
    const { session } = await authenticate.admin(request);
    if (!session?.shop) throw new Error("No Shopify session");

    // ⚡ At this point, the Supabase insert/upsert should already have run
    // during /auth/callback. So the callback builds the CompleteShopSession
    // and sets it in the cookie.
    // If we reach here without a cookie, force re-auth.
    throw new Error("No complete session in storage, forcing re-auth");
  } catch {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const host = url.searchParams.get("host");

    const authUrl = `/auth${shop ? `?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ""}` : ""}`;
    throw redirect(authUrl);
  }
}
