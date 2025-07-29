import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";
import { createClient } from "../utils/supabase/server";

export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    const supabase = createClient(request);
    
    // Delete the session from your Supabase sessions table
    await supabase
      .from('sessions')
      .delete()
      .eq('id', session.id);
      
    // Optionally, also clean up shop data
    await supabase
      .from('shops')
      .delete()
      .eq('store_url', shop);
  }

  return new Response();
};
