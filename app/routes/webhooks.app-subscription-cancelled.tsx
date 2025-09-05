import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import { writeAppSubscription } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  if (topic !== "app_subscriptions/cancelled") return new Response("Wrong topic", { status: 400 });
  await writeAppSubscription({ ...payload, status: "CANCELLED" }, shop);
  return new Response("OK");
};
