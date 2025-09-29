//app/routes/app.subscription.plans.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page} from "@shopify/polaris";
import { getAuthContext} from "../lib/auth/getAuthContext.server"

export async function loader({ request }: LoaderFunctionArgs) {
   const { shopsID, currentUserId, session} = await getAuthContext(request);
  return json(
    {
      apiKey: process.env.SHOPIFY_CLIENT_ID || "",
      session
    }
       
  );
}
export default function Plans() {
  const { session } = useLoaderData<typeof loader>();
  return (
   
    <Page title="Product Template Deployment">
    </Page>
    );
}