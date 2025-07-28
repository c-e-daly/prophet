// app/routes/auth.callback.js
export async function loader({ request }) {
  const url = new URL(request.url);
  const forwardUrl = `https://jqqmquuomykzdeplumki.supabase.co/functions/v1/oauth2callback?${url.searchParams.toString()}`;

  const response = await fetch(forwardUrl, {
    headers: Object.fromEntries(request.headers),
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

