// app/lib/queries/consumer_geolocation.ts
import { ShopSessionContext } from "../../../routes/app";
import  createClient  from "../../../../supabase/server";

export async function getConsumerGeolocation(shopsID) {
  const supabase = createClient();
 
  const { data, error } = await supabase.rpc("consumer_geolocation", {
    p_shop_id: shops.shopsID,
  });

  if (error) {
    console.error("[geolocation] RPC error:", error);
    throw new Error(error.message);
  }

  console.log("[geolocation] RPC ok. typeof data:", typeof data); // should be 'object'
  return data ?? {};
}

