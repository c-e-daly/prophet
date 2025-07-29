import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const url = new URL(request.url);
  const forwardUrl = `https://jqqmquuomykzdeplumki.supabase.co/functions/v1/oauth2callback?${url.searchParams.toString()}`;


  const response = await fetch(forwardUrl, {
    headers: Object.fromEntries(request.headers.entries()),
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
