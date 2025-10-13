// app/utils/flash.server.ts
import { createCookieSessionStorage, redirect } from "@remix-run/node";

// Export this type so routes can use it
export type FlashMessage = {
  type: "success" | "error" | "info" | "warning";
  message: string;
};

const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-in-production";

const flashStorage = createCookieSessionStorage({
  cookie: {
    name: "__flash",
    httpOnly: true,
    maxAge: 60, // 60 seconds - message auto-expires
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

/**
 * Get flash message from session and clear it
 */
export async function getFlashMessage(request: Request): Promise<FlashMessage | null> {
  const session = await flashStorage.getSession(request.headers.get("Cookie"));
  const message = session.get("flash") as FlashMessage | undefined;

  // Return headers to clear the flash
  const headers = new Headers();
  headers.append("Set-Cookie", await flashStorage.destroySession(session));

  return message || null;
}

/**
 * Set flash message and redirect
 */
export async function redirectWithSuccess(url: string, message: string) {
  const session = await flashStorage.getSession();
  session.flash("flash", { type: "success", message } as FlashMessage);

  return redirect(url, {
    headers: {
      "Set-Cookie": await flashStorage.commitSession(session),
    },
  });
}

export async function redirectWithError(url: string, message: string) {
  const session = await flashStorage.getSession();
  session.flash("flash", { type: "error", message } as FlashMessage);

  return redirect(url, {
    headers: {
      "Set-Cookie": await flashStorage.commitSession(session),
    },
  });
}

export async function redirectWithInfo(url: string, message: string) {
  const session = await flashStorage.getSession();
  session.flash("flash", { type: "info", message } as FlashMessage);

  return redirect(url, {
    headers: {
      "Set-Cookie": await flashStorage.commitSession(session),
    },
  });
}

export async function redirectWithWarning(url: string, message: string) {
  const session = await flashStorage.getSession();
  session.flash("flash", { type: "warning", message } as FlashMessage);

  return redirect(url, {
    headers: {
      "Set-Cookie": await flashStorage.commitSession(session),
    },
  });
}