import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "../utils/supabase/server";

type LoaderData = {
  authenticated: boolean;
  shop: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    // No shop param - redirect to login
    return redirect("/auth/login");
  }

  const supabase = createClient(request);

  // Get shop ID from the `shops` table
  const { data: shopRecord } = await supabase
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
      // Authenticated - redirect to app
      return redirect(`/app?shop=${shop}`);
    }
  }

  // Not authenticated - start OAuth flow
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

export default function Index() {
  // This should never render due to redirects
  return <div>Initializing PROPHET...</div>;
}