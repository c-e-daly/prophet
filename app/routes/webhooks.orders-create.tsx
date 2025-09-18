/// app/webhooks.orders-create.tsx


import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { writeOrder } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("📦 Orders webhook received");
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log("📋 Webhook details:", { topic, shop });
    console.log("📦 Order payload preview:", {
      id: payload?.id,
      name: payload?.name,
      email: payload?.email,
      customer_id: payload?.customer?.id
    });
    
    if (topic !== "orders/create") {
      console.error("❌ Wrong topic received:", topic, "expected: orders/create");
      return new Response("Wrong topic", { status: 400 });
    }
    
    // Validate required fields
    if (!payload?.id) {
      console.error("❌ Missing order ID in payload");
      return new Response("Missing order ID", { status: 400 });
    }
    
    await writeOrder(payload, shop);
    console.log("✅ Order written successfully:", payload.id);
    return new Response("OK");
    
  } catch (error) {
    console.error("❌ Orders webhook failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return new Response("Internal Server Error", { status: 500 });
  }
};