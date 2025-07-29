import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info("GDPR webhook handler initialized");

Deno.serve(async (req: Request): Promise<Response> => {
  const topic = req.headers.get("x-shopify-topic");
  if (!topic) {
    return new Response(JSON.stringify({ status: "error", message: "Missing topic header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ status: "error", message: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const shopDomain = payload.shop_domain || payload.shop || null;
  const shopId = payload.shop_id || null;
  const customerId = payload.customer?.id || payload.customer_id || null;
  const customerEmail = payload.customer?.email || payload.email || null;
  const ordersRequested = payload.orders_requested || null;

  const body = {
    request_type: topic,
    shop_domain: shopDomain,
    shop_id: shopId,
    customer_id: customerId,
    customer_email: customerEmail,
    orders_requested: ordersRequested,
    raw_payload: payload,
    received_at: new Date().toISOString(),
  };

  const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Missing Supabase environment variables");
    return new Response(JSON.stringify({
      status: "error",
      message: "Server misconfigured",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/gdprrequests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error writing to gdprrequests:", errorText);
    return new Response(JSON.stringify({
      status: "error",
      message: "Failed to record GDPR request",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.info(`GDPR: ${topic} recorded for shop ${shopDomain}`);

  return new Response(JSON.stringify({
    status: "ok",
    message: "GDPR request recorded",
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
