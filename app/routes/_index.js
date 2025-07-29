import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "../utils/supabase/server";
import styles from '../styles/styles.module.css';
export async function loader({ request }) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    if (!shop) {
        return json({ error: "Shop parameter required" }, { status: 400 });
    }
    const supabase = createClient(request);
    // Get shop ID from the `shops` table
    const { data: shopRecord, error: shopError } = await supabase
        .from("shops")
        .select("id")
        .eq("store_url", shop)
        .single();
    const shopId = shopRecord?.id;
    if (shopId) {
        const { data: shopAuth } = await supabase
            .from("shopAuths")
            .select("access_token")
            .eq("shop_id", shopId)
            .single();
        if (shopAuth?.access_token) {
            return json({ authenticated: true, shop });
        }
    }
    const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID_DEV;
    const SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products";
    const CALLBACK_URL = process.env.SHOPIFY_CALLBACK_URL;
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
        `client_id=${CLIENT_ID}&` +
        `scope=${SCOPES}&` +
        `redirect_uri=${CALLBACK_URL}&` +
        `state=${crypto.randomUUID()}`;
    return redirect(authUrl);
}
export default function Home() {
    const { authenticated, shop } = useLoaderData();
    if (authenticated) {
        return (_jsxs("div", { className: styles.container, children: [_jsx("h1", { children: "Welcome to your Shopify App!" }), _jsxs("p", { children: ["Connected to: ", shop] })] }));
    }
    return _jsx("p", { children: "Redirecting to authentication..." });
}
