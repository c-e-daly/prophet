// app/lib/queries/withShopAction.ts
// A higher-order action wrapper that injects { shopId, shopDomain, brandName }
// into Remix action functions. Keeps shop/session handling DRY and consistent
// with withShopLoader.

import type { ActionFunctionArgs } from "@remix-run/node";
import { getShopSession } from "./getShopSession";

// Generic wrapper: takes your action logic and ensures it always runs with shop context
export function withShopAction<
  T extends (args: { shopId: number; shopDomain: string; brandName: string; request: Request }) => Promise<any>
>(fn: T) {
  return async ({ request }: ActionFunctionArgs) => {
    const { shopId, shopDomain, brandName } = await getShopSession(request);
    return fn({ shopId, shopDomain, brandName, request });
  };
}
