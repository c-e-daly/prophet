// app/lib/queries/withShopLoader.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getShopSession, type ShopSession } from "./getShopSession";

type ShopLoaderArgs = ShopSession & {
  request: Request;
  params: LoaderFunctionArgs["params"];
};

export function withShopLoader<T extends (args: ShopLoaderArgs) => Promise<any>>(fn: T) {
  return async ({ request, params }: LoaderFunctionArgs) => {
    const session = await getShopSession(request);
    return fn({ ...session, request, params });
  };
}
