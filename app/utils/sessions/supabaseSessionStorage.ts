// app/utils/supabase/supabaseSessions.ts
// app/utils/sessions/supabaseSessionStorage.ts
import type { Session } from "@shopify/shopify-api";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import { createClient } from "../supabase/server"; // SRK client (no args)

/** Map Shopify Session -> DB row */
function toRow(s: Session) {
  return {
    // DB columns (adjust if your schema differs)
    sessionid: s.id,
    shop: s.shop,
    state: s.state,
    isonline: s.isOnline ?? false,
    scope: s.scope ?? null,
    expires: s.expires ? new Date(s.expires).toISOString() : null,

    // Optional fields we’ve seen in your helpers
    access_token: (s as any).accessToken ?? null,
    userid: (s as any).userId ?? null,
    first_name: (s as any).firstName ?? null,
    last_name: (s as any).lastName ?? null,
    email: (s as any).email ?? null,
    account_owner: (s as any).accountOwner ?? null,
    locale: (s as any).locale ?? null,
    collaborator: (s as any).collaborator ?? null,
    email_verified: (s as any).emailVerified ?? null,
  };
}

/** Map DB row -> Shopify Session */
function fromRow(row: any): Session {
  // The Shopify lib accepts a plain object with Session shape.
  // We include optionals conditionally.
  return {
    id: row.sessionid,
    shop: row.shop,
    state: row.state,
    isOnline: !!row.isonline,
    scope: row.scope ?? undefined,
    expires: row.expires ? new Date(row.expires) : undefined,

    ...(row.access_token ? { accessToken: row.access_token } : {}),
    ...(row.userid ? { userId: row.userid } : {}),
    ...(row.first_name ? { firstName: row.first_name } : {}),
    ...(row.last_name ? { lastName: row.last_name } : {}),
    ...(row.email ? { email: row.email } : {}),
    ...(row.account_owner !== undefined ? { accountOwner: row.account_owner } : {}),
    ...(row.locale ? { locale: row.locale } : {}),
    ...(row.collaborator !== undefined ? { collaborator: row.collaborator } : {}),
    ...(row.email_verified !== undefined ? { emailVerified: row.email_verified } : {}),
  } as unknown as Session;
}

export const supabaseSessionStorage: SessionStorage = {
  /** Create or update a session */
  async storeSession(session: Session): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("session").upsert(toRow(session));
    if (error) {
      console.error("storeSession error:", error);
      return false;
    }
    return true;
  },

  /** Load a session by ID */
  async loadSession(id: string): Promise<Session | undefined> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("session")
      .select("*")
      .eq("sessionid", id)
      .maybeSingle();

    if (error) {
      console.error("loadSession error:", error);
      return undefined;
    }
    if (!data) return undefined;
    return fromRow(data);
  },

  /** Delete a single session by ID */
  async deleteSession(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("session").delete().eq("sessionid", id);
    if (error) {
      console.error("deleteSession error:", error);
      return false;
    }
    return true;
  },

  /**
   * Delete multiple sessions by IDs (⚠️ this signature is required by the current interface)
   * Called e.g. during cleanup.
   */
  async deleteSessions(ids: string[]): Promise<boolean> {
    if (!ids.length) return true;
    const supabase = createClient();
    const { error } = await supabase.from("session").delete().in("sessionid", ids);
    if (error) {
      console.error("deleteSessions error:", error);
      return false;
    }
    return true;
  },

  /** Find all sessions belonging to a shop */
  async findSessionsByShop(shop: string): Promise<Session[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("session")
      .select("*")
      .eq("shop", shop);

    if (error) {
      console.error("findSessionsByShop error:", error);
      return [];
    }
    return (data ?? []).map(fromRow);
  },
};

export default supabaseSessionStorage;
