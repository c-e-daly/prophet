// app/lib/helpers/withShopAction.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireShopSession } from "../session/shopAuth.server";
import type { ShopSession } from "../queries/getShopSession";

export type ShopActionFunction<T = any> = (
  args: ActionFunctionArgs & { shopSession: ShopSession }
) => Promise<T>;

export function withShopAction<T>(actionFn: ShopActionFunction<T>) {
  return async (args: ActionFunctionArgs) => {
    const { shopSession } = await requireShopSession(args.request);
    return actionFn({ ...args, shopSession });
  };
}