// Root route - handles initial app access and redirects properly
// app/_index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // For Shopify app installation, just pass through ALL parameters
  const searchParams = url.searchParams.toString();
  
  if (searchParams) {
    throw redirect(`/app?${searchParams}`);
  }
  
  // Fallback for direct access
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