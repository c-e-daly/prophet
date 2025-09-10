// ===== 4. app/routes/app._index.tsx (HOME PAGE WITH SESSION DATA) =====
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, List, Banner, Text } from "@shopify/polaris";
import { authenticate } from "../utils/shopify/shopify.server";
import { useShopSession } from "./app";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  return json({
    shop: session.shop,
    hasToken: !!session.accessToken,
  });
}

export default function AppHome() {
  const { shop, hasToken } = useLoaderData<typeof loader>();
  
  // Get session data from context (includes Supabase data)
  const shopSession = useShopSession();

  return (
    <Page title="PROPHET Dashboard">
      <Banner
        title={`Welcome to PROPHET, ${shopSession.shopsBrandName}!`}
        tone="success"
        onDismiss={() => {}}
      >
        <p>Your customer intelligence platform is ready to go.</p>
      </Banner>
      
      <div style={{ marginTop: "1rem" }}>
        <Card>
          <div style={{ padding: "1.5rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>🎉 Successfully Connected!</h2>
            
            <div style={{
              background: "#f6f6f7",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem"
            }}>
              <h3>Connection Details:</h3>
              <Text as="p"><strong>Shop:</strong> {shop}</Text>
              <Text as="p"><strong>Brand Name:</strong> {shopSession.shopsBrandName}</Text>
              <Text as="p"><strong>Shop ID:</strong> {shopSession.shopsId}</Text>
              <Text as="p"><strong>Status:</strong> {hasToken ? "✅ Connected" : "❌ Not Connected"}</Text>
              <Text as="p"><strong>Session Type:</strong> Complete with Supabase data</Text>
            </div>

            <h3 style={{ marginBottom: "0.5rem" }}>What's Next?</h3>
            <List>
              <List.Item>✅ OAuth authentication completed</List.Item>
              <List.Item>✅ Shop data stored in Supabase</List.Item>
              <List.Item>✅ Session management active</List.Item>
              <List.Item>🚀 Ready to access Shopify APIs</List.Item>
              <List.Item>📊 Start building customer intelligence features</List.Item>
            </List>

            <div style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#e3f2fd",
              borderRadius: "8px"
            }}>
              <h4>🔮 PROPHET Features Available:</h4>
              <List>
                <List.Item>Customer analytics and insights</List.Item>
                <List.Item>Purchase behavior tracking</List.Item>
                <List.Item>Revenue intelligence</List.Item>
                <List.Item>Automated reporting</List.Item>
              </List>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}


/*
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
  */