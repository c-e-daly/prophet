import { SessionStorage } from '@shopify/shopify-app-session-storage';
import { Session } from '@shopify/shopify-api';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionStorage implements SessionStorage {
  private supabase: SupabaseClient;
  private tableName: string;

  constructor(supabase: SupabaseClient, tableName: string = 'sessions') {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  async storeSession(session: Session): Promise<boolean> {
    try {
      const payload = {
        id: session.id,
        shop: session.shop,
        state: session.state,
        scope: session.scope,
        expires: session.expires?.toISOString() || null,
        isOnline: session.isOnline,
        accessToken: session.accessToken,
        onlineAccessInfo: session.onlineAccessInfo || null,
      };

      const { error } = await this.supabase
        .from(this.tableName)
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch (err) {
      console.error('Error storing session:', err);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return undefined;
      }

      const session = new Session(data.id);
      session.shop = data.shop;
      session.state = data.state;
      session.scope = data.scope;
      session.expires = data.expires ? new Date(data.expires) : undefined;
      session.isOnline = data.isOnline;
      session.accessToken = data.accessToken;
      session.onlineAccessInfo = data.onlineAccessInfo;

      return session;
    } catch (err) {
      console.error('Error loading session:', err);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      return !error;
    } catch (err) {
      console.error('Error deleting session:', err);
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .in('id', ids);

      return !error;
    } catch (err) {
      console.error('Error deleting sessions:', err);
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('shop', shop);

      if (error || !data) {
        return [];
      }

      return data.map(sessionData => {
        const session = new Session(sessionData.sessionId);
        session.shop = sessionData.shop;
        session.state = sessionData.state;
        session.scope = sessionData.scope;
        session.expires = sessionData.expires ? new Date(sessionData.expires) : undefined;
        session.isOnline = sessionData.isOnline;
        session.accessToken = sessionData.accessToken;
        session.onlineAccessInfo = sessionData.onlineAccessInfo;
        return session;
      });
    } catch (err) {
      console.error('Error finding sessions by shop:', err);
      return [];
    }
  }
}