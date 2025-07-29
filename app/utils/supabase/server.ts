// utils/supabase/server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Simple client for Edge Functions - use this for OAuth callbacks
export function createClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server operations
  );
}

// SSR client if you need cookie-based auth (for frontend)
export function createSSRClient(request: Request) {
  const { createServerClient } = require("@supabase/ssr");
  
  const cookies = request.headers.get("cookie") ?? "";
  const cookieStore = new Map<string, string>();
  
  if (cookies) {
    cookies.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookieStore.set(name, decodeURIComponent(value));
      }
    });
  }

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.entries()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll() {
          // Edge functions can't set cookies directly
        },
      },
    }
  );
}