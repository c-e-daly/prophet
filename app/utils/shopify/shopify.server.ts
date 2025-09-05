// app/utils/shopify/shopify.server.ts
import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, shopifyApp } from "@shopify/shopify-app-remix/server";
import { DeliveryMethod } from "@shopify/shopify-api"; // 👈 enum, not string
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prismaBase from "../../lib/prisma/prismbase";

const apiKey = process.env.SHOPIFY_CLIENT_ID as string;
const apiSecretKey = process.env.SHOPIFY_CLIENT_SECRET as string;

if (!apiKey || !apiSecretKey) {
  throw new Error(
    `Missing required environment variables: ${!apiKey ? "SHOPIFY_CLIENT_ID" : ""} ${
      !apiSecretKey ? "SHOPIFY_CLIENT_SECRET" : ""
    }`,
  );
}

const shopify = shopifyApp({
  apiKey,
  apiSecretKey,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES ? process.env.SCOPES.split(",") : [],
  appUrl: process.env.SHOPIFY_APP_URL || "https://prophet-beta.vercel.app",
  authPathPrefix: "/auth",
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  sessionStorage: new PrismaSessionStorage(prismaBase),
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}),

  // ✅ Use DeliveryMethod enum; routes must exist for each callbackUrl
  webhooks: {
    // Checkouts
    CHECKOUTS_CREATE: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/checkouts-create" },
    CHECKOUTS_UPDATE: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/checkouts-update" },

    // Orders
    ORDERS_CREATE:    { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-create" },
    ORDERS_UPDATED:   { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-updated" },
    ORDERS_FULFILLED: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-fulfilled" },
    ORDERS_CANCELLED: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-cancelled" },

    // App uninstall
    APP_UNINSTALLED:  { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/app-uninstalled" },

    // App Billing (your app’s subscription charges)
    APP_SUBSCRIPTIONS_UPDATE:    { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/app-subscriptions-update" },
    APP_SUBSCRIPTIONS_CANCELLED: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/app-subscriptions-cancelled" },

    // Storefront Subscriptions (merchant’s product subscriptions)
    SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/subscription-billing-success" },
    SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/subscription-billing-failure" },
  },

  hooks: {
    // ✅ Register using the app helper, not admin.webhooks
    afterAuth: async ({ session }) => {
      await shopify.registerWebhooks({ session });
    },
  },
});

export default shopify;

export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks; // optional: handy for a manual “reinstall” route
export const sessionStorage = shopify.sessionStorage;
