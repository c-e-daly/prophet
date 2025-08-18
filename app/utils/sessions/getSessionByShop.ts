// app/utils/session/getSessionByShop.ts
import { createClient } from "../supabase/server";

type SessionRecord = {
  id: string;
  shop: string;
  scope?: string;
  access_token?: string;
  [key: string]: any;
};

export async function getSessionByShop(shop: string): Promise<SessionRecord | null> {
  const supabase = createClient(); // SRK, no args
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
