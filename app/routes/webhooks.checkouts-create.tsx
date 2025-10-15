// app/routes/webhooks.checkouts.create.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { upsertShopifyCheckoutWebhook } from "../lib/webhooks/upsertShopifyCheckoutWebhook";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { topic, shop, payload } = await authenticate.webhook(request);
  if (topic !== "CHECKOUTS_CREATE") return new Response("Wrong topic", { status: 400 });
  const { shopsID} = await getAuthContext(request);

  await upsertShopifyCheckoutWebhook({ shopDomain: shop, shopsID: shopsID, payload }); // throws on failure
  return new Response("OK");
};
