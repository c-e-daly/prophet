import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info("GDPR webhook handler initialized");
Deno.serve(async (req)=>{
  const topic = req.headers.get("x-shopify-topic");
  const payload = await req.json();
  const shopDomain = payload.shop_domain || payload.shop || null;
  const shopId = payload.shop_id || null;
  // Conditional fields
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
    received_at: new Date().toISOString()
  };
  const { error } = await Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") && fetch(`${Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/gdprrequests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
    },
    body: JSON.stringify(body)
  });
  if (error) {
    console.error("Error writing to gdprrequests:", error);
    return new Response(JSON.stringify({
      status: "error",
      message: "Failed to record GDPR request"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  console.info(`GDPR: ${topic} recorded for shop ${shopDomain}`);
  return new Response(JSON.stringify({
    status: "ok",
    message: "GDPR request recorded"
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
