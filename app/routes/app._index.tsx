//app._index.tsx - Fixed version
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from '@remix-run/react';
import { Page, Card, List } from '@shopify/polaris';
import { requireCompleteShopSession } from '../lib/session/shopAuth.server';

// Loader function runs on server-side
export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession } = await requireCompleteShopSession(request);
  
  return json({
    shop: shopSession.shopDomain,
    shopName: shopSession.shopName,
    hasToken: shopSession.hasToken
  });
}

// Component runs on both server and client
export default function AppHome() {
  const { shop, shopName, hasToken } = useLoaderData<typeof loader>();

  return (
    <Page title="PROPHET App - Successfully Installed!">
      <Card>
        <div style={{ padding: "20px" }}>
          <h1>🎉 PROPHET App - Successfully Installed!</h1>
          
          <div style={{ background: "#f0f8ff", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
            <h2>Shop Details:</h2>
            <p><strong>Shop:</strong> {shopName}</p>
            <p><strong>Domain:</strong> {shop}</p>
            <p><strong>Authentication:</strong> {hasToken ? "✅ Connected" : "❌ Not Connected"}</p>
          </div>
          
          <div style={{ marginTop: "30px" }}>
            <h3>What's Next?</h3>
            <List>
              <List.Item>✅ OAuth flow completed successfully</List.Item>
              <List.Item>✅ Shop credentials stored in database</List.Item>
              <List.Item>🔄 Ready to build your app features!</List.Item>
            </List>
          </div>

          <div style={{ marginTop: "30px", padding: "15px", background: "#e8f5e8", borderRadius: "8px" }}>
            <h4>Better customer intelligence to power your shop</h4>
            <p>You can now:</p>
            <List>
              <List.Item>Make Shopify API calls using the stored access token</List.Item>
              <List.Item>Build your app's main functionality</List.Item>
              <List.Item>Create embedded app UI components</List.Item>
            </List>
          </div>
        </div>
      </Card>
    </Page>
  );
}