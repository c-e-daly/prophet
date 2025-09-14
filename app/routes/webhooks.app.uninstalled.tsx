// app/routes/webhooks.app.uninstalled.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import  createClient  from "../../supabase/server";

function normalizeShopDomain(shop: string) {
  // Your normalization logic
  return shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop } = await authenticate.webhook(request);
  
  if (topic !== "app/uninstalled") {
    return new Response("Wrong topic", { status: 400 });
  }

  const normalizedShop = normalizeShopDomain(shop);

  try {
    // Find the shop
    const supabase = createClient();

    const { data: shopData, error: findErr } = await supabase
      .from("shops")
      .select("id, shopDomain")
      .eq("shopDomain", normalizedShop)
      .limit(1)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!shopData?.id) {
      console.error(`Shop not found for ${normalizedShop}`);
      return new Response("Shop not found", { status: 404 });
    }

    // Update shop status
    const { error: shopsErr } = await supabase
      .from("shops")
      .update({
        isActive: false,
        uninstallDate: new Date().toISOString(),
      })
      .eq("id", shopData.id);

    if (shopsErr) throw shopsErr;

    // Clear auth tokens
    const { error: authErr } = await supabase
      .from("shopauth")
      .update({
        accessToken: "",
        shopifyScope: "",
      })
      .eq("shops", shopData.id); 

    if (authErr) throw authErr;

    console.log(`App uninstalled for shop: ${normalizedShop}`);
    return new Response("OK");

  } catch (error) {
    console.error("App uninstall webhook error:", error);
    return new Response("Internal error", { status: 500 });
  }
}

export async function loader({}: LoaderFunctionArgs) {
  return new Response("Method Not Allowed", { status: 405 });
}