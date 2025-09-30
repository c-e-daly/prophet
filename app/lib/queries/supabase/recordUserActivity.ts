// app/lib/queries/supabase/recordUserActivity.ts
import createClient from "../../../../supabase/server";
import type { Inserts } from "../../types/dbTables";

export type UserActivityInput = {
  shopId: number;
  userId: number;
  userEmail: string;
  action: string; // 'program_created', 'program_updated', 'campaign_created', etc.
  entityType: string; // 'program', 'campaign', 'offer', etc.
  entityId: number;
  details?: Record<string, any>; // Additional context as JSON
};

export async function recordUserActivity(input: UserActivityInput) {
  const supabase = createClient();

  const row: Inserts<"shopifyUserActivity"> = {
    shops: input.shopId,
    shopifyUsers: input.userId,
    actionType: input.action,
    entityType: input.entityType,
    entityID: input.entityId,
    details: input.details || null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("shopifyUserActivity")
    .insert(row);

  if (error) {
    // Log but don't throw - activity tracking shouldn't break the main action
    console.error("Failed to record user activity:", error);
  }
}