import { SessionStorage } from '@shopify/shopify-app-session-storage';
import { Session } from '@shopify/shopify-api';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a single Supabase client instance using service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export class SupabaseSessionStorage implements SessionStorage {
  private supabase: SupabaseClient;
  private tableName: string;

  constructor(tableName: string = 'sessions') {
    this.supabase = supabase; // Use the module-level client
    this.tableName = tableName;
  }

  async storeSession(session: Session): Promise<boolean> {
    try {
      const payload = {
        sessionid: session.id,
        shop: session.shop,
        state: session.state,
        scope: session.scope,
        expires: session.expires?.toISOString() || null,
        isOnline: session.isOnline,
        accessToken: session.accessToken,
        onlineAccessInfo: session.onlineAccessInfo ? JSON.stringify(session.onlineAccessInfo) : null,
        updated_at: new Date().toISOString(),
      };

      console.log('Storing session:', { sessionId: session.id, shop: session.shop });

      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(payload, { 
          onConflict: 'sessionid',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Error storing session:', error);
        return false;
      }

      console.log('Session stored successfully');

      return true;
    } catch (err) {
      console.error('Error storing session:', err);
      return false;
    }
  }

  private async createOrUpdateShopData(session: Session): Promise<void> {
    console.log("Create or update Shop Data: ", {session});
    try {
      const now = new Date().toISOString();
            
      console.log('🏪 Creating shop record for:', session.shop);
      const shopData = {
        shopDomain: session.shop, 
        companyLegalName: session.shop,
        storeCurrency: 'USD', 
        commercePlatform: "shopify",
        companyPhone: null,
        companyAddress: null,
        isActive: true,
        createDate: now,
        modifiedDate: now,
      };

      const { data: shopsRow, error: shopError } = await this.supabase
        .from("shops")
        .upsert(shopData, { onConflict: "shopDomain" })
        .select()
        .single();

      if (shopError) {
        console.error('🏪 Error creating shop record:', shopError);
        throw shopError;
      }

      if (!shopsRow) {
        throw new Error('Shop upsert returned no data');
      }

      
      const authData = {
        id: session.shop, 
        shops: shopsRow.id, 
        accessToken: session.accessToken, 
        shopifyScope: session.scope || '',
        createDate: now,
        modifiedDate: now,
        created_by: "session_storage",
      };

      const { data: authRow, error: authError } = await this.supabase
        .from("shopauth")
        .upsert(authData, { onConflict: "id" })
        .select()
        .single();

      if (authError) {
        console.error('🔑 Error creating shopauth record:', authError);
        throw authError;
      }

      console.log('🔑 ACCESS TOKEN STORED SUCCESSFULLY:', { 
        id: authRow.id, 
        hasToken: !!authRow.accessToken 
      });

    } catch (error) {
      console.error('🏪 Error in createOrUpdateShopData:', error);
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('sessionid', id)
        .single();

      if (error || !data) {
        console.log('No session found for ID:', id);
        return undefined;
      }

      const session = new Session(data.sessionid);
      session.shop = data.shop;
      session.state = data.state;
      session.scope = data.scope;
      session.expires = data.expires ? new Date(data.expires) : undefined;
      session.isOnline = data.isOnline;
      session.accessToken = data.accessToken;
      
      if (data.onlineAccessInfo) {
        try {
          session.onlineAccessInfo = JSON.parse(data.onlineAccessInfo);
        } catch (parseError) {
          console.error('Error parsing onlineAccessInfo:', parseError);
          session.onlineAccessInfo = data.onlineAccessInfo;
        }
      }

      console.log('Session loaded:', { sessionId: session.id, shop: session.shop });
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
        .eq('sessionid', id);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      console.log('Session deleted:', id);
      return true;
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
        .in('sessionid', ids);

      if (error) {
        console.error('Error deleting sessions:', error);
        return false;
      }

      console.log('Sessions deleted:', ids);
      return true;
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

      if (error || !data || data.length === 0) {
        console.log('No sessions found for shop:', shop);
        return [];
      }

      const sessions = data.map(sessionData => {
        const session = new Session(sessionData.sessionid);
        session.shop = sessionData.shop;
        session.state = sessionData.state;
        session.scope = sessionData.scope;
        session.expires = sessionData.expires ? new Date(sessionData.expires) : undefined;
        session.isOnline = sessionData.isOnline;
        session.accessToken = sessionData.accessToken;
        
        if (sessionData.onlineAccessInfo) {
          try {
            session.onlineAccessInfo = JSON.parse(sessionData.onlineAccessInfo);
          } catch (parseError) {
            console.error('Error parsing onlineAccessInfo:', parseError);
            session.onlineAccessInfo = sessionData.onlineAccessInfo;
          }
        }
        
        return session;
      });

      console.log(`Found ${sessions.length} sessions for shop:`, shop);
      return sessions;
    } catch (err) {
      console.error('Error finding sessions by shop:', err);
      return [];
    }
  }
}

// Export a singleton instance
export const sessionStorage = new SupabaseSessionStorage();

