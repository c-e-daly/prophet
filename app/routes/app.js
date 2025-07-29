import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet, useLoaderData, useRouteError, } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../lib/shopify.server";
export const links = () => [
    { rel: "stylesheet", href: polarisStyles },
];
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return {
        apiKey: process.env.SHOPIFY_CLIENT_ID_DEV || "",
    };
};
export default function App() {
    const { apiKey } = useLoaderData();
    return (_jsxs(AppProvider, { isEmbeddedApp: true, apiKey: apiKey, children: [_jsxs(NavMenu, { children: [_jsx(Link, { to: "/app", rel: "home", children: "Home" }), _jsx(Link, { to: "/app/additional", children: "Additional page" })] }), _jsx(Outlet, {})] }));
}
// Shopify needs Remix to catch thrown responses so headers are applied
export function ErrorBoundary() {
    return boundary.error(useRouteError());
}
export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};
