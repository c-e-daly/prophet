// app/lib/helpers/withShopAction.ts - FIXED
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireShopSession } from "../session/shopAuth.server"; // FIXED IMPORT
import type { CompleteShopSession } from "../types/shopSession"; // FIXED TYPE

export type ShopActionFunction<T = any> = (
  args: ActionFunctionArgs & { shopSession: CompleteShopSession }
) => Promise<T>;

export function withShopAction<T>(actionFn: ShopActionFunction<T>) {
  return async (args: ActionFunctionArgs) => {
    const { shopSession } = await requireShopSession(args.request);
    return actionFn({ ...args, shopSession });
  };
}