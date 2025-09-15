//app/routes/app.pricebuilder.tsx
import { Outlet } from "@remix-run/react";
import { json, type LoaderFunctionArgs} from "@remix-run/node";
import { useLoaderData , useLocation} from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
return json(
  {
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
    session
  }
);
}
export default function PriceBuilderLayout() {
  const { session } = useLoaderData<typeof loader>();
  const location = useLocation();
  
return (
  <Page >
    <Outlet key={location.pathname}/>
  </Page>
   );



}