// app/lib/helpers/withShopLoader.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireShopSession } from "../session/shopAuth.server";
import type { CompleteShopSession } from "../types/shopSession";

export type ShopLoaderFunction<T = any> = (
  args: LoaderFunctionArgs & { shopSession: CompleteShopSession }
) => Promise<T>;

// Only use this if you need fresh session data in a specific loader
// Most of the time, use useShopContext() in the component instead
export function withShopLoader<T>(loaderFn: ShopLoaderFunction<T>) {
  return async (args: LoaderFunctionArgs) => {
    const { shopSession, headers } = await requireShopSession(args.request);
    
    const result = await loaderFn({ ...args, shopSession });
    
    // Merge headers if the loader returns Response with headers
    if (result instanceof Response && headers) {
      const existingHeaders = result.headers.get("Set-Cookie");
      if (existingHeaders) {
        result.headers.set("Set-Cookie", `${existingHeaders}, ${headers["Set-Cookie"]}`);
      } else {
        result.headers.set("Set-Cookie", headers["Set-Cookie"]);
      }
    }
    
    return result;
  };
}
