// app/lib/queries/supabase/_rpc.ts
import createClient from "../../../../supabase/server";
import type { Database } from "../../../../supabase/database.types";

type Functions = Database["public"]["Functions"];
type FnName = Extract<keyof Functions, string>;
type FnArgs<K extends FnName> = Functions[K]["Args"];
type FnReturns<K extends FnName> = Functions[K]["Returns"];

// --- SINGLE ---

// Typed when the function is in Database types
export async function callRpcSingle<K extends FnName>(
  fn: K,
  args: FnArgs<K>
): Promise<FnReturns<K>>;

// Fallback when not in Database types yet (or you want to coerce)
export async function callRpcSingle<T = unknown>(
  fn: string,
  args?: Record<string, any>
): Promise<T>;

export async function callRpcSingle(fn: any, args?: any): Promise<any> {
  const supabase = createClient();
  // Cast to any to avoid the "unknown not assignable" error from Supabase rpc signature
  const { data, error } = await (supabase.rpc as any)(fn, args);
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return data;
}

// --- LIST (RETURNS TABLE(rows jsonb, total_count bigint)) ---

export type RpcListResult<T> = { rows: T[]; totalCount: number };

// Typed
export async function callRpcList<K extends FnName, T = unknown>(
  fn: K,
  args: FnArgs<K>
): Promise<RpcListResult<T>>;

// Fallback
export async function callRpcList<T = unknown>(
  fn: string,
  args?: Record<string, any>
): Promise<RpcListResult<T>>;

export async function callRpcList(fn: any, args?: any): Promise<RpcListResult<any>> {
  const supabase = createClient();
  const { data, error } = await (supabase.rpc as any)(fn, args);
  if (error) throw new Error(`${fn} failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  const rows = (row?.rows ?? []) as any[];
  const totalCount = Number(row?.total_count ?? 0);
  return { rows, totalCount };
}
