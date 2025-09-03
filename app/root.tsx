// app/root.tsx
import {Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData} from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getFlexibleShopSession, requirePartialShopSession, requireCompleteShopSession } from "../app/lib/session/shopAuth.server";


export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Different auth requirements based on route
  if (url.pathname.startsWith("/install") || url.pathname.startsWith("/auth")) {
    // Install routes only need partial session
    const { shopSession, headers } = await requirePartialShopSession(request);
    return json(
      { shopSession, isInstallFlow: true },
      { headers: headers ? headers : undefined }
    );
  } else {
    // App routes need complete session
    const { shopSession, headers } = await requireCompleteShopSession(request);
    return json(
      { shopSession, isInstallFlow: false },
      { headers: headers ? headers : undefined }
    );
  }
}

export default function App() {
  const { shopSession, isInstallFlow } = useLoaderData<typeof loader>();;
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        
        <Outlet context={{ shopSession, isInstallFlow }}/>
       
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}