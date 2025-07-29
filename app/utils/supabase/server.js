import { createServerClient } from "@supabase/supabase-js";
import { parse, serialize } from "cookie";
export function createClient(request) {
    const cookies = parse(request.headers.get("cookie") || "");
    const headers = new Headers();
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL or ANON key is not set in environment variables");
    }
    return createServerClient(supabaseUrl, supabaseKey, {
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
    });
}
