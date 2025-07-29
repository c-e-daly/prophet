// Shopify OAuth handler - catches all /auth/* requests

import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs): Promise<null> => {
  await authenticate.admin(request);
  return null;
};
