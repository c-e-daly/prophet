/// app/webhooks.orders-create.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { writeOrder, type OrderWebhookTopic } from "../lib/webhooks/write";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1) Capture raw body once
  const rawBody = await request.text();

  // 2) Rebuild a fresh Request with the same body/headers for your auth helper
  const rebuilt = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: rawBody,
    duplex: "half", // safe for node >=18 (ignored in most runtimes but harmless)
  });

  // 3) Call your existing helper (single-arg)
  const { topic, shop, payload } = await authenticate.webhook(rebuilt);

  // 4) Guard on the actual Shopify topic string
  if (topic !== "ORDERS_CREATE") {
    return new Response("Wrong topic", { status: 400 });
  }

  // 5) Call writeOrder with topic + rawBody for bigint-safe ingest
  const id = await writeOrder(payload, shop, {
    topic: topic as OrderWebhookTopic,
    rawBody, // <- we kept it from step 1
  });

  return json({ ok: true, id });
};
