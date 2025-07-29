import { createClient } from "../supabase/server";
export async function getSessionByShop(request, shop) {
    const supabase = createClient(request);
    const { data, error } = await supabase
        .from("session")
        .select("*")
        .eq("shop", shop)
        .maybeSingle();
    if (error) {
        console.error("Failed to fetch session:", error);
        throw error;
    }
    return data;
}
