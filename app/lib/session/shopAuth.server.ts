// app/lib/session/shopAuth.server.ts
import { redirect } from "@remix-run/node";
import { getShopSession as fetchCompleteShopSession } from "../queries/getShopSession";
import { getShopSessionFromStorage, setShopSessionInStorage, setPartialShopSession } from "./shopSession.server";
import type { ShopSession, PartialShopSession, CompleteShopSession } from "../types/shopSession";
import { isCompleteShopSession } from "../types/shopSession";

// For install flow - only requires Shopify auth, not Supabase record
export async function requirePartialShopSession(request: Request): Promise<{
  shopSession: PartialShopSession;
  headers?: { "Set-Cookie": string };
}> {
  // Check if we have any cached session first
  let shopSession = await getShopSessionFromStorage(request);
  
  if (shopSession) {
    return { shopSession: shopSession as PartialShopSession };
  }
  
  // Get Shopify session data
  try {
    const { authenticate } = await import("../../utils/shopify/shopify.server");
    const { session } = await authenticate.admin(request);
    
    if (!session?.shop) {
      throw new Error("No Shopify session");
    }
    
    const shopDomain = session.shop;
    const shopName = shopDomain.replace(".myshopify.com", "");
    const hasToken = !!session.accessToken;
    
    // Store minimal session data
    const cookie = await setPartialShopSession(request, shopDomain, shopName, hasToken);
    
    const partialSession: PartialShopSession = {
      shopDomain,
      shopName,
      hasToken,
    };
    
    return { 
      shopSession: partialSession,
      headers: { "Set-Cookie": cookie }
    };
  } catch (error) {
    throw redirect("/auth/install");
  }
}

// For app routes - requires complete session with Supabase data
export async function requireCompleteShopSession(request: Request): Promise<{
  shopSession: CompleteShopSession;
  headers?: { "Set-Cookie": string };
}> {
  let shopSession = await getShopSessionFromStorage(request);
  
  // If we have a complete session, return it
  if (shopSession && isCompleteShopSession(shopSession)) {
    return { shopSession };
  }
  
  // If we have partial session, try to upgrade it
  if (shopSession && !isCompleteShopSession(shopSession)) {
    try {
      const completeSession = await fetchCompleteShopSession(request);
      const cookie = await setShopSessionInStorage(request, completeSession);
      return { 
        shopSession: completeSession,
        headers: { "Set-Cookie": cookie }
      };
    } catch (error) {
      // Shop not found in DB, redirect to install completion
      throw redirect("/install/complete");
    }
  }
  
  // No session at all, get fresh complete session
  try {
    const completeSession = await fetchCompleteShopSession(request);
    const cookie = await setShopSessionInStorage(request, completeSession);
    return { 
      shopSession: completeSession,
      headers: { "Set-Cookie": cookie }
    };
  } catch (error) {
    // Either not authenticated or shop not in DB
    throw redirect("/auth/install");
  }
}

// FIXED: This is what withShopLoader was looking for
export async function requireShopSession(request: Request): Promise<{
  shopSession: CompleteShopSession;
  headers?: { "Set-Cookie": string };
}> {
  // This is just an alias for requireCompleteShopSession to maintain compatibility
  return requireCompleteShopSession(request);
}

// For flexible routes that work in both states
export async function getFlexibleShopSession(request: Request): Promise<{
  shopSession: ShopSession;
  isComplete: boolean;
  headers?: { "Set-Cookie": string };
}> {
  const { shopSession, headers } = await requirePartialShopSession(request);
  const isComplete = isCompleteShopSession(shopSession);
  
  return { shopSession, isComplete, headers };
}
