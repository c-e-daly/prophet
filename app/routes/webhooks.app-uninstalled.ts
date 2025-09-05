import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import { handleAppUninstalled } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  if (topic !== "app/uninstalled") return new Response("Wrong topic", { status: 400 });
  await handleAppUninstalled(shop);
  return new Response("OK");
};
