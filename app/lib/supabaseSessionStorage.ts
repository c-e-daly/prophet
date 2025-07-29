import { createClient } from "@supabase/supabase-js";
import type { SessionStorage } from "@shopify/shopify-app-remix/server";
import { Session } from "@shopify/shopify-app-remix/server";

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    cookies: {
      get() {
        return "";
      },
      set() {},
      remove() {},
    },
  }
);

const TABLE_NAME = "sessions";

export const supabaseSessionStorage: SessionStorage = {
  async storeSession(session: Session): Promise<boolean> {
    const { id, ...rest } = session;

    await supabase
      .from(TABLE_NAME)
      .upsert({ id, session: JSON.stringify(rest) }, { onConflict: "id" });

    return true;
  },

  async loadSession(id: string): Promise<Session | undefined> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("session")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;

    const session = new Session(id);
    Object.assign(session, JSON.parse(data.session));
    return session;
  },

  async deleteSession(id: string): Promise<boolean> {
    await supabase.from(TABLE_NAME).delete().eq("id", id);
    return true;
  },

  async deleteSessions(ids: string[]): Promise<boolean> {
    await supabase.from(TABLE_NAME).delete().in("id", ids);
    return true;
  },

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const { data } = await supabase.from(TABLE_NAME).select("session");

    return (data || [])
      .map((row) => {
        const s = new Session("");
        Object.assign(s, JSON.parse(row.session));
        return s;
      })
      .filter((s) => s.shop === shop);
  },
};
