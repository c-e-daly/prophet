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
        session_id: session.id, // Map session.id to session_id column
        shop: session.shop,
        state: session.state,
        scope: session.scope,
        expires: session.expires?.toISOString() || null,
        is_online: session.isOnline, // Use snake_case for consistency
        access_token: session.accessToken,
        online_access_info: session.onlineAccessInfo ? JSON.stringify(session.onlineAccessInfo) : null,
      };

      console.log('Storing session payload:', payload);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(payload, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Supabase upsert error:', error);
        return false;
      }

      console.log('Session stored successfully:', data);
      return true;
    } catch (err) {
      console.error('Error storing session:', err);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      console.log('Loading session with ID:', id);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('session_id', id) // Query by session_id, not id
        .single();

      if (error) {
        console.error('Supabase load error:', error);
        return undefined;
      }

      if (!data) {
        console.log('No session found for ID:', id);
        return undefined;
      }

      console.log('Raw session data from Supabase:', data);

      // Create session with the original session ID
      const session = new Session(data.session_id);
      session.shop = data.shop;
      session.state = data.state;
      session.scope = data.scope;
      session.expires = data.expires ? new Date(data.expires) : undefined;
      session.isOnline = data.is_online;
      session.accessToken = data.access_token;
      
      // Parse JSON if it exists
      if (data.online_access_info) {
        try {
          session.onlineAccessInfo = JSON.parse(data.online_access_info);
        } catch (parseError) {
          console.error('Error parsing online_access_info:', parseError);
          session.onlineAccessInfo = data.online_access_info;
        }
      }

      console.log('Loaded session:', session);
      return session;
    } catch (err) {
      console.error('Error loading session:', err);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      console.log('Deleting session with ID:', id);

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('session_id', id); // Delete by session_id, not id

      if (error) {
        console.error('Supabase delete error:', error);
        return false;
      }

      console.log('Session deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      console.log('Deleting sessions with IDs:', ids);

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .in('session_id', ids); // Delete by session_id, not id

      if (error) {
        console.error('Supabase batch delete error:', error);
        return false;
      }

      console.log('Sessions deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting sessions:', err);
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      console.log('Finding sessions for shop:', shop);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('shop', shop);

      if (error) {
        console.error('Supabase findByShop error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('No sessions found for shop:', shop);
        return [];
      }

      console.log('Raw sessions data for shop:', data);

      return data.map(sessionData => {
        const session = new Session(sessionData.session_id); // Use session_id, not sessionId
        session.shop = sessionData.shop;
        session.state = sessionData.state;
        session.scope = sessionData.scope;
        session.expires = sessionData.expires ? new Date(sessionData.expires) : undefined;
        session.isOnline = sessionData.is_online;
        session.accessToken = sessionData.access_token;
        
        // Parse JSON if it exists
        if (sessionData.online_access_info) {
          try {
            session.onlineAccessInfo = JSON.parse(sessionData.online_access_info);
          } catch (parseError) {
            console.error('Error parsing online_access_info:', parseError);
            session.onlineAccessInfo = sessionData.online_access_info;
          }
        }
        
        return session;
      });
    } catch (err) {
      console.error('Error finding sessions by shop:', err);
      return [];
    }
  }
}

/*
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

*/