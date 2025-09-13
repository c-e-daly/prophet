// ===== 4. app/routes/app._index.tsx (HOME PAGE WITH SESSION DATA) =====
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, List, Banner, Text } from "@shopify/polaris";
import { requireShopSession } from "../lib/session/shopAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireShopSession(request);
  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      shopSession,
    } as const,
    { headers }
  );
}



export default function AppHome() {
  const { shopSession } = useLoaderData<typeof loader>();

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
              <Text as="p"><strong>Shop:</strong> {shopSession.shopDomain}</Text>
              <Text as="p"><strong>Brand Name:</strong> {shopSession.shopsBrandName}</Text>
              <Text as="p"><strong>Shop ID:</strong> {shopSession.shopsId}</Text>
              <Text as="p"><strong>Status:</strong> {shopSession.hasToken ? "✅ Connected" : "❌ Not Connected"}</Text>
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