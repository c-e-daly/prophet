// app/routes/webhooks.scopes-update.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleScopesUpdate, type ScopesUpdatePayload } from "../lib/webhooks/scopes-update";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  
  if (topic !== "scopes/update") {
    return new Response("Wrong topic", { status: 400 });
  }
  
  try {
    // Type the payload properly
    const scopesPayload = payload as ScopesUpdatePayload;
    
    // Validate the payload has required fields
    if (!scopesPayload.granted_scopes || !scopesPayload.revoked_scopes) {
      console.error("Invalid scopes update payload:", payload);
      return new Response("Invalid payload", { status: 400 });
    }
    
    await handleScopesUpdate(scopesPayload, shop);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Failed to handle scopes update:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};