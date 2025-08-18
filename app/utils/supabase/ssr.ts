// utils/supabase/ssr.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-side with cookies (OAuth/session flows), uses ANON key, enforces RLS */
export function createClient(request: Request, headers: Headers): SupabaseClient {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const jar = Object.fromEntries(
            (request.headers.get("cookie") ?? "")
              .split(";")
              .map(c => c.trim().split("="))
              .filter(([k, v]) => k && v) as [string, string][]
          );
          return jar[name] ? decodeURIComponent(jar[name]) : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          headers.append("Set-Cookie", serialize(name, value, options));
        },
        remove(name: string, options: CookieOptions) {
          headers.append("Set-Cookie", serialize(name, "", { ...options, maxAge: 0 }));
        },
      },
    }
  );
}

function serialize(name: string, value: string, opts: CookieOptions = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.httpOnly ?? true) parts.push("HttpOnly");
  if (opts.secure ?? true) parts.push("Secure");
  // Embedded app (iframe) requires SameSite=None
  parts.push(`SameSite=${opts.sameSite ?? "None"}`);
  return parts.join("; ");
}

export default createClient;
