// app/routes/app.campaigns.tsx
import { Outlet, useLocation ,useNavigate} from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react";
import { Page, Text, Link} from "@shopify/polaris";
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

export default function CampaignsLayout() {
  const { session } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();

  return (
   <Page>
  <Link onClick={() => navigate("/app/campaigns")}>
    <Text as="p">Go to Index</Text>
  </Link>

  <Outlet key={location.pathname} />
</Page>
    
  );
}