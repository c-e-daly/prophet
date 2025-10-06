// app/sessions.server.ts
import { createCookieSessionStorage } from "@remix-run/node";
import crypto from "node:crypto";

function getSessionSecret() {
  const s =
    process.env.SESSION_SECRET ||
    process.env.COOKIE_SECRET ||
    process.env.SHOPIFY_APP_SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required");
  }
  // dev fallback
  return crypto.randomBytes(32).toString("hex");
}

const isProd = process.env.NODE_ENV === "production";

const flashStorage = createCookieSessionStorage({
  cookie: {
    name: "__pb_flash",
    httpOnly: true,
    path: "/",
    // IMPORTANT for embedded Shopify (iframe):
    sameSite: isProd ? "none" : "lax",
    secure: isProd, // required when SameSite=None
    secrets: [getSessionSecret()],
    maxAge: 60 * 10,
  },
});

export function getFlashSession(cookieHeader: string | null) {
  return flashStorage.getSession(cookieHeader ?? "");
}
export const commitFlashSession = flashStorage.commitSession;
