// app/lib/queries/withShopLoader.ts
// a higher-order loader that injects { shopId, shopDomain, brandName }
// into your Remix loader functions. This keeps shop/session handling DRY
// and ensures every loader is scoped to the correct shop.

import type { LoaderFunctionArgs } from "@remix-run/node";
import { getShopSession } from "./getShopSession";

// Generic wrapper: takes your loader logic and ensures it always runs with shop context
export function withShopLoader<
  T extends (args: { shopId: number; shopDomain: string; brandName: string; request: Request }) => Promise<any>
>(fn: T) {
  return async ({ request }: LoaderFunctionArgs) => {
    const { shopId, shopDomain, brandName } = await getShopSession(request);
    return fn({ shopId, shopDomain, brandName, request });
  };
}
