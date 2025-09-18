import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleScopesUpdate, type ScopesUpdatePayload } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🔄 Scopes update webhook received");
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log("📋 Webhook details:", { topic, shop, payload });
    
    if (topic !== "app/scopes_update") {
      console.error("❌ Wrong topic received:", topic, "expected: app/scopes_update");
      return new Response("Wrong topic", { status: 400 });
    }
    
    // Log the raw payload to understand its structure
    console.log("📦 Raw payload:", JSON.stringify(payload, null, 2));
    
    // Cast and validate the payload
    const scopesPayload = payload as ScopesUpdatePayload;
    
    // More flexible validation - check if fields exist and are arrays
    if (!scopesPayload.granted_scopes) {
      console.error("❌ Missing granted_scopes in payload:", payload);
      return new Response("Invalid payload - missing granted_scopes", { status: 400 });
    }
    
    if (!Array.isArray(scopesPayload.granted_scopes)) {
      console.error("❌ granted_scopes is not an array:", typeof scopesPayload.granted_scopes, scopesPayload.granted_scopes);
      return new Response("Invalid payload - granted_scopes must be array", { status: 400 });
    }
    
    // revoked_scopes might not always be present or might be undefined
    if (scopesPayload.revoked_scopes && !Array.isArray(scopesPayload.revoked_scopes)) {
      console.error("❌ revoked_scopes is not an array:", typeof scopesPayload.revoked_scopes, scopesPayload.revoked_scopes);
      return new Response("Invalid payload - revoked_scopes must be array", { status: 400 });
    }
    
    // Ensure revoked_scopes is an array (default to empty if not provided)
    if (!scopesPayload.revoked_scopes) {
      scopesPayload.revoked_scopes = [];
    }
    
    await handleScopesUpdate(scopesPayload, shop);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Failed to handle scopes update:", error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return new Response("Internal Server Error", { status: 500 });
  }
};