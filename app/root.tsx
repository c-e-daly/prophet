// app/root.tsx
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import "@shopify/polaris/build/esm/styles.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://cdn.shopify.com/" },
  {
    rel: "stylesheet",
    href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID as string;

  if (!SHOPIFY_CLIENT_ID) {
    throw new Error("SHOPIFY_CLIENT_ID environment variable is required");
  }

  return json({
    shopOrigin: new URL(request.url).searchParams.get("shop"),
    apiKey: SHOPIFY_CLIENT_ID,
  });
};

export default function Root() {
  const { shopOrigin, apiKey } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider
          isEmbeddedApp
          apiKey={apiKey}
        // Pass any other required props
        >
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
}