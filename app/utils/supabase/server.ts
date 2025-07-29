import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parse, serialize, type SerializeOptions } from "cookie";

export function createSupabaseClient(request: Request): {
  client: SupabaseClient;
  getSetCookieHeader: () => string | null;
} {
  const cookies = parse(request.headers.get("cookie") || "");

  let setCookie: string | null = null;

  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key: string) => cookies[key],
        set: (key: string, value: string, options: SerializeOptions) => {
          setCookie = serialize(key, value, options);
        },
        remove: (key: string, options: SerializeOptions) => {
          setCookie = serialize(key, "", options);
        },
      },
    }
  );

  return {
    client,
    getSetCookieHeader: () => setCookie,
  };
}
