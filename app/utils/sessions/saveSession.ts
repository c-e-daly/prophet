import { createClient } from "../../utils/supabase/server";

type SessionInput = {
  id: string;
  shop: string;
  state?: string;
  isOnline?: boolean;
  scope?: string;
  expires?: string | null;
  accessToken?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  accountOwner?: boolean;
  locale?: string;
  collaborator?: boolean;
  emailVerified?: boolean;
};

interface SaveSessionArgs {
  request: Request;
  session: SessionInput;
}

export async function saveSession({ request, session }: SaveSessionArgs): Promise<void> {
  const supabase = createClient(request);

  const { error } = await supabase.from("session").upsert({
    sessionid: session.id,
    shop: session.shop,
    state: session.state,
    isonline: session.isOnline,
    scope: session.scope,
    expires: session.expires,
    access_token: session.accessToken,
    userid: session.userId,
    first_name: session.firstName,
    last_name: session.lastName,
    email: session.email,
    account_owner: session.accountOwner,
    locale: session.locale,
    collaborator: session.collaborator,
    email_verified: session.emailVerified,
  });

  if (error) {
    console.error("Failed to save session:", error);
    throw error;
  }
}
