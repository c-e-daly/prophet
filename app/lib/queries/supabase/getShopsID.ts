// app/lib/db/getShopsIDFromShopDomain.server.ts
import createClient from '../../../../supabase/server';

export async function getShopsID(shop: string): Promise<number | null> {
  const supabase = createClient();

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id')
    .eq('shopDomain', shop)
    .single();
  
  if (error || !shops) {
    console.error('Error fetching shop:', error);
    return null;
  }
  
  return shops.id; // Returns number now
}