import supabasePkg from '@supabase/supabase-js';
const { createServerClient } = supabasePkg;

const supabase = createServerClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    cookies: {
      get() { return ''; },
      set() {},
      remove() {},
    },
  }
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
