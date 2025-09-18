// app/utils/http.ts
export function badRequest(message = "Bad request") {
  throw new Response(message, { status: 400 });
}
export function notFound(message = "Not found") {
  throw new Response(message, { status: 404 });
}
