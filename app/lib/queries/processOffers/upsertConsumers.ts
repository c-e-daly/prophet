// app/lib/supabase/consumers.ts
import { getSb } from "./client.server";

export async function saveCustomerToSupabase(args: {
  shopsId: number; email: string; customerGID: string;
}): Promise<{ consumerId: number }> {
  const sb = getSb();

  // update first
  const upd = await sb.from("consumers")
    .update({ customerGID, modifiedDate: new Date().toISOString() })
    .eq("shop", args.shopsId)
    .ilike("email", args.email)
    .select("id")
    .maybeSingle();

  if (upd.data?.id) return { consumerId: upd.data.id as number };

  // insert if missing
  const ins = await sb.from("consumers")
    .insert([{ shop: args.shopsId, email: args.email, customerGID, createDate: new Date().toISOString() }])
    .select("id")
    .single();

  if (ins.error) throw new Error(ins.error.message);
  return { consumerId: ins.data!.id as number };
}
