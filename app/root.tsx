// app/root.tsx
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useRouteError} from "@remix-run/react";
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

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY as string;

if (!SHOPIFY_API_KEY) {
  throw new Error("SHOPIFY_API_KEY environment variable is required");
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    shopOrigin: new URL(request.url).searchParams.get("shop"),
  });
};


export default function Root() {
  const { shopOrigin } = useLoaderData<typeof loader>();

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
          apiKey={SHOPIFY_API_KEY}
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