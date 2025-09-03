// app/lib/session/shopSession.server.ts
import { createCookieSessionStorage } from "@remix-run/node";
import type { ShopSession, ShopsRow, PartialShopSession, CompleteShopSession } from "../types/shopSession";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__shop_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export { sessionStorage };

export async function getShopSessionFromStorage(request: Request): Promise<ShopSession | null> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);
  
  const shopSession = session.get("shopSession");
  if (!shopSession) return null;
  
  // Validate session hasn't expired
  const sessionExpiry = session.get("sessionExpiry");
  if (sessionExpiry && Date.now() > sessionExpiry) {
    return null;
  }
  
  return shopSession;
}

export async function setShopSessionInStorage(
  request: Request,
  shopSession: ShopSession
): Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);
  
  session.set("shopSession", shopSession);
  session.set("sessionExpiry", Date.now() + (60 * 60 * 24 * 7 * 1000)); // 7 days
  
  return sessionStorage.commitSession(session);
}

// Store just the minimal data needed during install
export async function setPartialShopSession(
  request: Request,
  shopDomain: string,
  shopName: string,
  hasToken: boolean
): Promise<string> {
  const partialSession: PartialShopSession = {
    shopDomain,
    shopName,
    hasToken,
  };
  
  return setShopSessionInStorage(request, partialSession);
}

// Update session with Supabase data after shop is created
export async function upgradeToCompleteSession(
  request: Request,
  shops: ShopsRow,
  shopsId: number,
  shopsBrandName: string
): Promise<string> {
  const existingSession = await getShopSessionFromStorage(request);
  
  if (!existingSession) {
    throw new Error("No existing session to upgrade");
  }
  
  const completeSession: CompleteShopSession = {
    ...existingSession,
    shops,
    shopsId,
    shopsBrandName,
  };
  
  return setShopSessionInStorage(request, completeSession);
}

export async function destroyShopSession(request: Request): Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);
  return sessionStorage.destroySession(session);
}