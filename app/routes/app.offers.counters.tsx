// app/routes/app.offers.counter.tsx
import { Outlet } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
}

export default function CountersLayout() {
    const { session } = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet  />
    </>
  );
}
