import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { writeCheckout } from "../lib/webhooks/write";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  const shops = await getShopsIDHelper(shop);
  if (topic !== "CHECKOUTS_CREATE") return new Response("Wrong topic", { status: 400 });
  await writeCheckout(payload, shop, shops);
  return new Response("OK");
};
