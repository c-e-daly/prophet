import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleScopesUpdate, type ScopesUpdatePayload } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🔄 Scopes update webhook received");
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log("📋 Webhook details:", { topic, shop });
    
    // Note: topic is 'APP_SCOPES_UPDATE' not 'app/scopes_update'
    if (topic !== "APP_SCOPES_UPDATE") {
      console.error("❌ Wrong topic received:", topic, "expected: APP_SCOPES_UPDATE");
      return new Response("Wrong topic", { status: 400 });
    }
    
    // Cast and validate the payload
    const scopesPayload = payload as ScopesUpdatePayload;
    
    // Validate required fields
    if (!scopesPayload.current || !Array.isArray(scopesPayload.current)) {
      console.error("❌ Invalid payload - missing or invalid current scopes:", payload);
      return new Response("Invalid payload - missing current scopes", { status: 400 });
    }
    
    if (!scopesPayload.previous || !Array.isArray(scopesPayload.previous)) {
      console.error("❌ Invalid payload - missing or invalid previous scopes:", payload);
      return new Response("Invalid payload - missing previous scopes", { status: 400 });
    }
    
    await handleScopesUpdate(scopesPayload, shop);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Failed to handle scopes update:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return new Response("Internal Server Error", { status: 500 });
  }
};