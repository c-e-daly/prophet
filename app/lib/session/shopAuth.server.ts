// app/lib/session/shopAuth.server.ts
import { redirect } from "@remix-run/node";
import { getShopSession } from "./shopSession.server";
import { isCompleteShopSession, type CompleteShopSession } from "../types/shopSession";
import { authenticate } from "../../utils/shopify/shopify.server";

export async function requireShopSession(request: Request): Promise<{
  shopSession: CompleteShopSession;
  headers?: { "Set-Cookie": string };
}> {
  // 1. Check cookie
  const existing = await getShopSession(request);
  if (existing && isCompleteShopSession(existing)) {
    return { shopSession: existing as CompleteShopSession };
  }

  // 2. If no session, redirect to auth
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  const authUrl = `/auth${shop ? `?shop=${encodeURIComponent(shop)}${host ? 
    `&host=${encodeURIComponent(host)}` : ""}` : ""}`;
  throw redirect(authUrl);
}