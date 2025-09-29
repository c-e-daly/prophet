// app/lib/types/activities.ts

export const actionLabels: Record<string, string> = {
  // Offer actions
  offer_reviewed: "Reviewed Offer",
  offer_approved: "Approved Offer",
  offer_rejected: "Rejected Offer",
  counteroffer_sent: "Sent Counteroffer",
  counteroffer_approved: "Approved Counteroffer",
  counteroffer_rejected: "Rejected Counteroffer",
  offer_assigned: "Assigned Offer",
  offer_reassigned: "Reassigned Offer",
  
  // Campaign actions
  campaign_created: "Created Campaign",
  campaign_modified: "Modified Campaign",
  campaign_deleted: "Deleted Campaign",
  
  // Program actions
  program_created: "Created Program",
  program_modified: "Modified Program",
  program_deleted: "Deleted Program",
  
  // Template actions
  template_created: "Created Template",
  template_modified: "Modified Template",
  
  // Discount actions
  discount_created: "Created Discount",
  
  // User actions
  user_login: "Logged In",
  user_invited: "Invited User",
  user_role_changed: "Changed User Role",
};

export const entityLabels: Record<string, string> = {
  offer: "Offer",
  counteroffer: "Counteroffer",
  campaign: "Campaign",
  program: "Program",
  template: "Template",
  discount: "Discount",
  cart: "Cart",
  consumer: "Consumer",
  user: "User",
};

/*Helper to format activity for display
export function formatActivity(log: ActivityLog): string {
  const action = ACTION_TYPE_LABELS[log.action_type] || log.action_type;
  const entity = ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type;
  return `${action} ${entity} #${log.entity_id}`;
}

// Example usage:
// formatActivity(log) => "Approved Offer #1234"
// formatActivity(log) => "Created Campaign #56"

*/