// app/routes/api.enums.tsx
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getEnumsServer } from "../lib/queries/getEnums.server";

export const loader = async (_args: LoaderFunctionArgs) => {
  const enums = await getEnumsServer();
  return json(enums);
};
