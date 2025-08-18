import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key in API routes, NOT anon
);

// Add this line to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopifyShopId = searchParams.get('shop');

  if (!shopifyShopId) {
    return new Response(JSON.stringify({ error: 'Missing shop parameter' }), { status: 400 });
  }

  // 1. Look up internal shop ID from Shopify shop ID
  const { data: shopRecord, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('shop_id', shopifyShopId)
    .single();

  if (shopError || !shopRecord) {
    return new Response(JSON.stringify({ error: 'Shop not found' }), { status: 404 });
  }

  // 2. Query carts for that shop
  const { data: carts, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('shop', shopRecord.id)
    .order('created_date', { ascending: false });

  if (cartError) {
    return new Response(JSON.stringify({ error: 'Failed to fetch carts' }), { status: 500 });
  }

  return new Response(JSON.stringify(carts), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}