// app/routes/shopify.jsx
export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  // Check existing session in Supabase
  const supabase = createClient(request);
  const { data: existingSession } = await supabase
    .from('shops')
    .select('*')
    .eq('shop_domain', shop)
    .single();
    
  if (existingSession?.access_token) {
    return redirect(`/app?shop=${shop}`);
  }
  
  // Build OAuth URL directly in Remix (no edge function needed)
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
  const SCOPES = process.env.SHOPIFY_SCOPES;
  const CALLBACK_URL = process.env.SHOPIFY_CALLBACK_URL;
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` + 
    `client_id=${CLIENT_ID}&` +
    `scope=${SCOPES}&` +
    `redirect_uri=${CALLBACK_URL}&` +
    `state=${generateState()}`;
    
  return redirect(authUrl);
}