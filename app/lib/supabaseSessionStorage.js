
import { createClient } from '@supabase/supabase-js';
import sessionStoragePkg from '@shopify/shopify-app-session-storage';
const { Session } = sessionStoragePkg;


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLE_NAME = 'sessions';

export const supabaseSessionStorage = {
  async storeSession(session) {
    const { id, ...rest } = session;

    await supabase
      .from(TABLE_NAME)
      .upsert({ id, session: JSON.stringify(rest) }, { onConflict: 'id' });

    return true;
  },

  async loadSession(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('session')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    const session = new Session(id);
    Object.assign(session, JSON.parse(data.session));
    return session;
  },

  async deleteSession(id) {
    await supabase.from(TABLE_NAME).delete().eq('id', id);
    return true;
  },

  async deleteSessions(ids) {
    await supabase.from(TABLE_NAME).delete().in('id', ids);
    return true;
  },

  async findSessionsByShop(shop) {
    const { data } = await supabase
      .from(TABLE_NAME)
      .select('session');

    return (data || [])
      .map((row) => {
        const s = new Session('');
        Object.assign(s, JSON.parse(row.session));
        return s;
      })
      .filter((s) => s.shop === shop);
  },
};
