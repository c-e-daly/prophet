import "@shopify/shopify-app-remix/adapters/node";
import {ApiVersion, AppDistribution, shopifyApp} from "@shopify/shopify-app-remix/server";
import { supabaseSessionStorage } from "./supabaseSessionStorage";

const apiKey = process.env.SHOPIFY_API_KEY as string;
const apiSecretKey = process.env.SHOPIFY_API_SECRET;

if (!apiKey || !apiSecretKey) {
  throw new Error(`Missing required environment variables: ${!apiKey ? 'SHOPIFY_CLIENT_ID' : ''} ${!apiSecretKey ? 'SHOPIFY_API_SECRET' : ''}`);
}

const shopify = shopifyApp({
  apiKey,
  apiSecretKey,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES ? process.env.SCOPES.split(",") : [],
  appUrl: process.env.SHOPIFY_APP_URL || "https://prophet-beta.vercel.app",
  authPathPrefix: "/auth",
  sessionStorage: supabaseSessionStorage,
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;

export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
