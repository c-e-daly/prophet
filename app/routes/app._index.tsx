//app._index.tsx is the app home page

import { useLoaderData } from '@remix-run/react';
import { Page, Card, Text, List, Banner } from '@shopify/polaris';
import type { loader } from './app';

export default function AppHome() {
  // This should automatically get data from the parent app.tsx loader
  const data = useLoaderData<typeof loader>();

  if (!data) {
    return (
      <Page title="Loading...">
        <Banner tone="critical">
          Error: No data received from parent loader
        </Banner>
      </Page>
    );
  }

  const { shop, shopName, hasToken } = data;

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

/*
import { useRouteLoaderData } from '@remix-run/react';
import { Page, Card, Text, List, Banner } from '@shopify/polaris';
import type { loader } from './app';


export default function AppHome() {
  const data = useRouteLoaderData<typeof loader>("routes/app");

if (!data) {
    return (
      <Page title="Loading...">
        <Banner tone="critical">
          Error: No data received from parent loader
        </Banner>
      </Page>
    );
  }

  const { shop, shopName, hasToken } = data;

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
       <h4>Better customer intelligence to power your shop</h4>
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
 */