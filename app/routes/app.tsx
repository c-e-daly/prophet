// app/routes/app.tsx - Your main Shopify embedded app
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "../utils/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }

  // Get shop info from Supabase
  const supabase = createClient();
  const { data: shopauth } = await supabase
    .from("shopauth")
    .select("shop_name, access_token")
    .eq("id", shop)
    .single();

  return ({
    shop,
    host,
    url: request.url,
    shopName: shopauth?.shop_name || shop,
    hasToken: !!shopauth?.access_token
  });
}

export default function App() {
  const { shop, shopName, url, hasToken } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <h1>🎉 PROPHET App - Successfully Installed!</h1>
      <div style={{ background: "#f0f8ff", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
        <h2>Shop Details:</h2>
        <p><strong>Shop:</strong> {shopName}</p>
        <p><strong>Domain:</strong> {shop}</p>
        <p><strong>Authentication:</strong> {hasToken ? "✅ Connected" : "❌ Not Connected"}</p>
      </div>
      
      <div style={{ marginTop: "30px" }}>
        <h3>What's Next?</h3>
        <ul>
          <li>✅ OAuth flow completed successfully</li>
          <li>✅ Shop credentials stored in database</li>
          <li>🔄 Ready to build your app features!</li>
        </ul>
      </div>

      <div style={{ marginTop: "30px", padding: "15px", background: "#e8f5e8", borderRadius: "8px" }}>
        <h4>App is ready for development!</h4>
        <p>You can now:</p>
        <ul>
          <li>Make Shopify API calls using the stored access token</li>
          <li>Build your app's main functionality</li>
          <li>Create embedded app UI components</li>
        </ul>
      </div>
    </div>
  );
}