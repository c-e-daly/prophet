// app/routes/install.complete.tsx - Upgrade partial to complete session
import { Form, useLoaderData } from "@remix-run/react";
import { requirePartialShopSession, upgradeToCompleteSession } from "../lib/session/shopAuth.server";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession } = await requirePartialShopSession(request);
  return json({ shopSession });
}

export async function action({ request }: ActionFunctionArgs) {
  const { shopSession } = await requirePartialShopSession(request);
  
  // Create shop record in Supabase
  const { createClient } = await import("../utils/supabase/server");
  const supabase = createClient();
  
  const { data: shops, error } = await supabase
    .from("shops")
    .insert({
      shopDomain: shopSession.shopDomain,
      shopName: shopSession.shopName,
      // other initial shop data
    })
    .select()
    .single();
  
  if (error || !shops) {
    throw new Error("Failed to create shop record");
  }
  
  // Upgrade session with Supabase data
  const cookie = await upgradeToCompleteSession(
    request,
    shops,
    shops.id,
    shops.brandName ?? shopSession.shopName
  );
  
  return redirect("/app", {
    headers: { "Set-Cookie": cookie }
  });
}

export default function InstallComplete() {
  const { shopSession } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Complete Installation for {shopSession.shopName}</h1>
      <Form method="post">
        <button type="submit">Complete Setup</button>
      </Form>
    </div>
  );
}
