// app/lib/queries/withShopAction.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { getShopSession, type ShopSession } from "./getShopSession";

type ShopActionArgs = ShopSession & {
  request: Request;
  params: ActionFunctionArgs["params"];
};

export function withShopAction<T extends (args: ShopActionArgs) => Promise<any>>(fn: T) {
  return async ({ request, params }: ActionFunctionArgs) => {
    const session = await getShopSession(request);
    return fn({ ...session, request, params });
  };
}
