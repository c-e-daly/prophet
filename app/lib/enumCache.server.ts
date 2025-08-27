// app/lib/enumCache.server.ts
import { fetchAllEnums, type EnumMap } from "./getEnums";

let cached: { at: number; data: EnumMap } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function getEnumsCached(): Promise<EnumMap> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.data;
  const data = await fetchAllEnums();
  cached = { at: now, data };
  return data;
}

// (optional) invalidate explicitly after deployments/admin actions:
export function invalidateEnumCache() { cached = null; }
