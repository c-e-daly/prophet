// app/utils/supabase/supabaseSessions.ts
import { createClient as createSSR } from "../../utils/supabase/server";

export function getClient(request: Request, headers: Headers) {
  return createSSR(request, headers);
}

export async function getSession(request: Request, headers: Headers) {
  const supabase = getClient(request, headers);
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session ?? null;
}

export async function setSession(
  request: Request,
  headers: Headers,
  tokens: { access_token: string; refresh_token?: string }
) {
  const supabase = getClient(request, headers);
  const { error } = await supabase.auth.setSession(tokens as any);
  if (error) throw error;
}

export async function signOut(request: Request, headers: Headers) {
  const supabase = getClient(request, headers);
  await supabase.auth.signOut();
}
