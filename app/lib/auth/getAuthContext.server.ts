// app/lib/auth/getAuthContext.server.ts
import { authenticate } from "../../shopify.server";
import { getShopsIDHelper } from "../../../supabase/getShopsID.server";

export type AuthContext = {
  session: any;
  shopDomain: string;
  shopsID: number; //supabase shops.id
  currentUserId?: number;  // Changed to number
  currentUserEmail?: string;
  currentUserName?: string;
};

/**
 * Get all authentication context needed for loaders/actions
 * Use this instead of repeating the same 5 lines everywhere
 */
export async function getAuthContext(request: Request): Promise<AuthContext> {
    const { session } = await authenticate.admin(request);
    if (!session?.shop) {
    throw new Error("No shop in session");
  }
  
  // Get shop ID from Supabase
  const shopsID = await getShopsIDHelper(session.shop);
  
  // Extract user info (if online tokens enabled)
  const userInfo = session.onlineAccessInfo?.associated_user;
  
  return {
    session,
    shopDomain: session.shop,
    shopsID,
    currentUserId: userInfo?.id ? Number(userInfo.id) : undefined,  // Ensure number
    currentUserEmail: userInfo?.email,
    currentUserName: userInfo?.first_name 
      ? `${userInfo.first_name} ${userInfo.last_name || ''}`.trim()
      : userInfo?.email,
  };
}

/**
 * Stricter version - requires user to be authenticated
 * Use this when you need to track who did something
 */
export async function requireAuthContext(request: Request): Promise<Required<AuthContext>> {
  const auth = await getAuthContext(request);
  
  if (!auth.currentUserId || !auth.currentUserEmail) {
    throw new Error("User authentication required. Enable online tokens.");
  }
  
  return auth as Required<AuthContext>;
}