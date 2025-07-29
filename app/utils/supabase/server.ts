// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { type CookieOptions } from "@supabase/ssr";

export function createClient(request: Request) {
  const requestUrl = new URL(request.url);
  const cookies = request.headers.get("cookie") ?? "";
  
  // Parse cookies from the request
  const cookieStore = new Map<string, string>();
  if (cookies) {
    cookies.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookieStore.set(name, value);
      }
    });
  }

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name);
        },
        set(name: string, value: string, options: CookieOptions) {
          // In a server environment, we can't set cookies directly
          // You might want to handle this differently based on your needs
        },
        remove(name: string, options: CookieOptions) {
          // In a server environment, we can't remove cookies directly
          // You might want to handle this differently based on your needs
        },
      },
    }
  );
}