// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration} from "@remix-run/react";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Only run in browser and if we have the required params
      
     if (typeof window !== 'undefined' && window.shopify) {
      const urlParams = new URLSearchParams(window.location.search);
      const host = urlParams.get('host');
      const shop = urlParams.get('shop');
      
      if (host && shop) {
        const app = (window as any).ShopifyApp.createApp({
          apiKey: process.env.SHOPIFY_CLIENT_ID, // Replace with your actual API key
          host: host,
        });
        
        console.log('App Bridge initialized:', app);
      }
    }
  }, []);


  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Preload App Bridge */}
        <link rel="preload" href="https://cdn.shopify.com/shopifycloud/app-bridge.js" as="script" />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}