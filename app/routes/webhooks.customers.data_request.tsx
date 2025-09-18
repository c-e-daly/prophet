// app/routes/webhooks.customers.data_request.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { verifyShopifyHmac, buildGdprRow, insertGdprRequest } from "../lib/webhooks/gdpr-shared";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const topic = "customers/data_request";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const hmac = request.headers.get("x-shopify-hmac-sha256");

  const raw = await request.text();
  if (!verifyShopifyHmac(raw, secret, hmac)) return new Response("Invalid HMAC", { status: 401 });

  const payload = JSON.parse(raw);
  const row = buildGdprRow(topic, payload);

  const { data, error } = await insertGdprRequest(row);
  if (error) {
    console.error("gdprrequests insert failed:", error);
    return new Response("DB insert failed", { status: 500 });
  }

  // OPTIONAL (if not using triggers):
  // const supabase = createClient();
  // await supabase.rpc("run_gdpr_consumer_request", { p_request_id: data.id });

  // Must return 200 quickly so Shopify doesn't retry
  return json({ ok: true, id: data.id });
};
