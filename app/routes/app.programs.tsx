// app/routes/app.campaigns.programs.tsx
import { Outlet } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, List, Banner, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getAuthContext, requireAuthContext } from "../lib/auth/getAuthContext.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      session
    }
  );
}

export default function ProgramsLayout() {
    const { session } = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet  />
    </>
  );
}
