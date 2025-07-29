import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "../utils/supabase/server";
import styles from '../styles/styles.module.css';

type LoaderData = {
  authenticated: boolean;
  shop: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop parameter required" }, { status: 400 });
  }

  const supabase = createClient(request);

  // Get shop ID from the `shops` table
  const { data: shopRecord, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("store_url", shop)
    .single();

  const shopId = shopRecord?.id;

  if (shopId) {
    const { data: shopAuth } = await supabase
      .from("shopAuths")
      .select("access_token")
      .eq("shop_id", shopId)
      .single();

    if (shopAuth?.access_token) {
      return json<LoaderData>({ authenticated: true, shop });
    }
  }

  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID_DEV;
  const SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products";
  const CALLBACK_URL = process.env.SHOPIFY_CALLBACK_URL;

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `scope=${SCOPES}&` +
    `redirect_uri=${CALLBACK_URL}&` +
    `state=${crypto.randomUUID()}`;

  return redirect(authUrl);
}

export default function Home() {
  const { authenticated, shop } = useLoaderData<LoaderData>();

  if (authenticated) {
    return (
      <div className={styles.container}>
        <h1>Welcome to your Shopify App!</h1>
        <p>Connected to: {shop}</p>
        {/* Your actual app UI here */}
      </div>
    );
  }

  return <p>Redirecting to authentication...</p>;
}
