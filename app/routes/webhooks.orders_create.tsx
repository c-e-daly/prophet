import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { writeOrder } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  if (topic !== "orders/create") return new Response("Wrong topic", { status: 400 });
  await writeOrder(payload, shop);
  return new Response("OK");
};
