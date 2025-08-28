// app/routes/webhooks.enum-changed.ts
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { invalidateEnumCache } from "../lib/enumCache.server";
import { broadcastEnumChange } from "../lib/enumBroadcast.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    throw json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-supabase-signature');
    
    // You can add signature verification here if needed
    // const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    
    const payload = await request.json();
    
    // Log what changed (for debugging)
    console.log('Enum change webhook received:', payload);
    
    // Invalidate server cache
    invalidateEnumCache();
    
    // Broadcast to all connected clients via Server-Sent Events
    await broadcastEnumChange();
    
    return json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    throw json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}