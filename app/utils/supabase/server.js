import { createServerClient, serialize, parse } from "@supabase/supabase-js";

export function createClient(request) {
  const cookies = parse(request.headers.get("Cookie") || "");
  const headers = new Headers();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabaseSession = getSessionByShop;
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    supabaseSession,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
}
