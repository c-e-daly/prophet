// ✅ Remix approach - app/routes/_index.jsx
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "~/utils/supabase.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  if (!shop) {
    return json({ error: 'Shop parameter required' }, { status: 400 });
  }
  
  // Check if shop is already authenticated in Supabase
  const supabase = createClient(request);
  const { data: shopAuth } = await supabase
    .from('shopAuths')
    .select('access_token')
    .eq('shop_id', (
      await supabase.from('shops').select('id').eq('store_url', shop).single()
    ).data?.id)
    .single();
    
  if (shopAuth?.access_token) {
    // Already authenticated, show the app
    return json({ authenticated: true, shop });
  }
  
  // Not authenticated, redirect to OAuth
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID_DEV;
  const SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,write_products';
  const CALLBACK_URL = process.env.SHOPIFY_CALLBACK_URL;
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` + 
    `client_id=${CLIENT_ID}&` +
    `scope=${SCOPES}&` +
    `redirect_uri=${CALLBACK_URL}&` +
    `state=${crypto.randomUUID()}`;
    
  return redirect(authUrl);
}

export default function Home() {
  const { authenticated, shop } = useLoaderData();
  
  if (authenticated) {
    return (
      <div>
        <h1>Welcome to your Shopify App!</h1>
        <p>Connected to: {shop}</p>
        {/* Your actual app UI here */}
      </div>
    );
  }
  
  return <p>Redirecting to authentication...</p>;
}
