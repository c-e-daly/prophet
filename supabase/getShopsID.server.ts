// app/lib/shops/getShopsID.server.ts
import createClient from "../supabase/server";

/** Look up shops.id by domain. Returns null if not found. */
export async function getShopsID(shopDomain: string): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("id")
    .eq("shopDomain", shopDomain)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getShopsID error:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Convenience helper that throws a 404 Response if not found. */
export async function getShopsIDHelper(shopDomain: string): Promise<number> {
  const id = await getShopsID(shopDomain);
  if (!id) throw new Response("Shop not found", { status: 404 });
  return id;
}
