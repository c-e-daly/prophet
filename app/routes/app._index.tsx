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