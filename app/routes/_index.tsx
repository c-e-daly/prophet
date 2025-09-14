// app/routes/_index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  // DEBUG: Log when this redirect is triggered
  console.log('ROOT _index.tsx redirect triggered:', {
    url: url.href,
    pathname: url.pathname,
    searchParams,
    timestamp: new Date().toISOString()
  });
  
  if (searchParams) {
    throw redirect(`/app?${searchParams}`);
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