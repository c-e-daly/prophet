// app/sessions.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET!;
if (!sessionSecret) throw new Error("SESSION_SECRET is required");

const flashStorage = createCookieSessionStorage({
  cookie: {
    name: "__pb_flash",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    maxAge: 60 * 10, // 10m safety window
  },
});

export function getFlashSession(cookieHeader: string | null) {
  return flashStorage.getSession(cookieHeader ?? "");
}
export const commitFlashSession = flashStorage.commitSession;
