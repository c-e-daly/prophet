import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { writeCheckout } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  if (topic !== "CHECKOUT_UPDATE") return new Response("Wrong topic", { status: 400 });
  await writeCheckout(payload, shop); // upsert on same table
  return new Response("OK");
};
