// Root route - handles initial app access and redirects properly
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");
  
  // If we have shop param, redirect to app
  if (shop) {
    const params = new URLSearchParams();
    params.set("shop", shop);
    if (host) params.set("host", host);
    
    throw redirect(`/app?${params.toString()}`);
  }
  
  // For embedded apps, if no shop param, redirect to app anyway
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