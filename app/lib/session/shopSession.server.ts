// app/lib/session/shopSession.server.ts
import { createCookieSessionStorage } from "@remix-run/node";
import type { ShopSession } from "../types/shopSession";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error("SESSION_SECRET must be set");

// Embedded apps: SameSite=None; Secure=true
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__shop_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "none",
    secure: true,
    secrets: [sessionSecret],
  },
});

export { sessionStorage };

export async function getShopSession(request: Request): Promise<ShopSession | null> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);
  const shopSession = session.get("shopSession");
  if (!shopSession) return null;

  const sessionExpiry = session.get("sessionExpiry");
  if (sessionExpiry && Date.now() > sessionExpiry) return null;

  return shopSession;
}

export async function setShopSessionInStorage(request: Request, shopSession: ShopSession):
 Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);
  session.set("shopSession", shopSession);
  session.set("sessionExpiry", Date.now() + 7 * 24 * 60 * 60 * 1000);
  return sessionStorage.commitSession(session);
}

export async function destroyShopSession(request: Request): Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);
  return sessionStorage.destroySession(session);
}
