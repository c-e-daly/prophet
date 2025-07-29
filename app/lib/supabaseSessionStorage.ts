import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import { Session } from "@shopify/shopify-app-remix/server";

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
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

    const sessionData = JSON.parse(data.session);
    const session = new Session({
      id,
      shop: sessionData.shop,
      state: sessionData.state,
      isOnline: sessionData.isOnline,
      scope: sessionData.scope,
      expires: sessionData.expires,
      accessToken: sessionData.accessToken,
      userId: sessionData.userId,
    });
    
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
        const sessionData = JSON.parse(row.session);
        return new Session({
          id: sessionData.id,
          shop: sessionData.shop,
          state: sessionData.state,
          isOnline: sessionData.isOnline,
          scope: sessionData.scope,
          expires: sessionData.expires,
          accessToken: sessionData.accessToken,
          userId: sessionData.userId,
        });
      })
      .filter((s) => s.shop === shop);
  },
};