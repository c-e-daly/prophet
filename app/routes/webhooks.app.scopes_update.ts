import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";
import db from "../lib/db.server";

export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current;

  if (session) {
    await db.session.update({
      where: {
        id: session.id,
      },
      data: {
        scope: current.toString(),
      },
    });
  }

  return new Response();
};
