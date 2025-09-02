// app/lib/queries/withShopAction.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { getShopSession, type ShopSession } from "./getShopSession";

export type ShopActionArgs = {
  request: Request;
  shopSession: ShopSession;
};

export function withShopAction<T>(
  handler: (args: ShopActionArgs) => Promise<T>
) {
  return async ({ request }: ActionFunctionArgs) => {
    const shopSession = await getShopSession(request);
    return handler({ request, shopSession });
  };
}
