// app/routes/webhooks.scopes-update.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleScopesUpdate, type ScopesUpdatePayload } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  
  if (topic !== "app/scopes_update") {
    return new Response("Wrong topic", { status: 400 });
  }
  
  try {
    // Cast and validate the payload
    const scopesPayload = payload as ScopesUpdatePayload;
    
    // Basic validation
    if (!scopesPayload.granted_scopes || !Array.isArray(scopesPayload.granted_scopes)) {
      console.error("Invalid scopes update payload - missing granted_scopes:", payload);
      return new Response("Invalid payload", { status: 400 });
    }
    
    if (!scopesPayload.revoked_scopes || !Array.isArray(scopesPayload.revoked_scopes)) {
      console.error("Invalid scopes update payload - missing revoked_scopes:", payload);
      return new Response("Invalid payload", { status: 400 });
    }
    
    await handleScopesUpdate(scopesPayload, shop);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Failed to handle scopes update:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};