import { createClient } from "../supabase/server";

type SessionRecord = {
  id: string;
  shop: string;
  scope?: string;
  access_token?: string;
  [key: string]: any; // You can replace or extend this with your actual session schema
};

export async function getSessionByShop(request: Request, shop: string): Promise<SessionRecord | null> {
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
