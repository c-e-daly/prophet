// Root route - handles initial app access and redirects properly
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (shop) {
    // Preserve important auth and app parameters
    const params = new URLSearchParams();
    params.set("shop", shop);
    
    // Preserve auth parameters
    const host = url.searchParams.get("host");
    const hmac = url.searchParams.get("hmac");
    const idToken = url.searchParams.get("id_token");
    const timestamp = url.searchParams.get("timestamp");
    
    if (host) params.set("host", host);
    if (hmac) params.set("hmac", hmac);
    if (idToken) params.set("id_token", idToken);
    if (timestamp) params.set("timestamp", timestamp);
    
    throw redirect(`/app?${params.toString()}`);
  }
  
  throw redirect("/app");
};

export default function Index() {
  return (
    <div>
      <h1>Redirecting...</h1>
      <p>Setting up your PROPHET app...</p>
    </div>
  );
}