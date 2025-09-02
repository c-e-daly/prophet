// app/lib/queries/withShopLoader.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getShopSession, type ShopSession } from "./getShopSession";

export type ShopLoaderArgs = {
  request: Request;
  shopSession: ShopSession;
};

export function withShopLoader<T>(
  handler: (args: ShopLoaderArgs) => Promise<T>
) {
  return async ({ request }: LoaderFunctionArgs) => {
    const shopSession = await getShopSession(request);
    return handler({ request, shopSession });
  };
}
