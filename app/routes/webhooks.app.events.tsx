// app/routes/webhooks.app.events.tsx - Consolidated app events
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleScopesUpdate, type ScopesUpdatePayload } from "../lib/webhooks/scopes-update";
import { handleAppUninstalled } from "../lib/webhooks/app-uninstalled";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  
  console.log(`📥 Received app event: ${topic} for shop: ${shop}`);

  try {
    switch (topic) {
      case "app/uninstalled":
        await handleAppUninstalled(payload, shop);
        break;
        
      case "app/scopes_update":
        const scopesPayload = payload as ScopesUpdatePayload;
        if (!scopesPayload.granted_scopes || !scopesPayload.revoked_scopes) {
          console.error("Invalid scopes update payload:", payload);
          return new Response("Invalid payload", { status: 400 });
        }
        await handleScopesUpdate(scopesPayload, shop);
        break;
        
      default:
        console.warn(`Unhandled app event topic: ${topic}`);
        return new Response(`Unhandled topic: ${topic}`, { status: 400 });
    }
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`Failed to handle ${topic}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
};