import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import { createClient } from "../utils/supabase/server";

export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    const supabase = createClient();
    
    // Delete the session from Supabase
    await supabase
      .from('sessions')
      .delete()
      .eq('id', session.id);
      
    // Optionally delete shop data as well
    await supabase
      .from('shops')
      .delete()
      .eq('shopDomain', shop);
  }

  return new Response();
};
