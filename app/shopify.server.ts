import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution,  shopifyApp,} from "@shopify/shopify-app-remix/server";
import { DeliveryMethod } from "@shopify/shopify-app-remix/server";
import { SupabaseSessionStorage } from "../supabase/SupabaseSessionStorage";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_CLIENT_ID,
  apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new SupabaseSessionStorage(),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),

webhooks: {
    CHECKOUTS_CREATE: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/checkouts-create" },
    CHECKOUTS_UPDATE: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/checkouts-update" },

    // Orders
    ORDERS_CREATE:    { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-create" },
    ORDERS_UPDATED:   { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-updated" },
    ORDERS_FULFILLED: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-fulfilled" },
    ORDERS_CANCELLED: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/orders-cancelled" },

    // App lifecycle
    APP_UNINSTALLED:  { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/app-uninstalled" },
    
    // SCOPES_UPDATE webhook
    SCOPES_UPDATE:    { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks/scopes-update" },
  },

  hooks: {
    afterAuth: async ({ session }) => {
      await shopify.registerWebhooks({ session });
    },
  }
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;