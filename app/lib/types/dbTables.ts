// app/lib.queries/types/dbTables.ts (optional convenience barrel)
import type { Database } from '../../../supabase/database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

  export type Enum<T extends keyof Database["public"]["Enums"]> =
  Database['public']['Enums'][T];

  // Specific type exports for convenience
export type OfferRow = Tables<'offers'>;
export type OfferInsert = Inserts<'offers'>;
export type OfferUpdate = Updates<'offers'>;
export type OfferStatus = Enum<'offerStatus'>;
export type CounterOfferRow = Tables<'counterOffers'>;
export type CartRow = Tables<'carts'>;
export type ConsumerRow  = Tables<'consumers'>;
export type CartItemRow  = Tables<'cartitems'>;
export type CampaignRow = Tables<'campaigns'>;
export type ProgramRow = Tables<'programs'>;
export type VariantRow  = Tables<'variants'>;
export type ConsumerShop12mRow = Database["public"]["Views"]["consumerShop12m"]["Row"];

// Helper to get all enum values as an array
export function getEnumValues<T extends string>(enumObj: Record<string, T>): T[] {
  return Object.values(enumObj);
}

export type OfferWithJoins = OfferRow & {
  carts: CartRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartitems: (CartItemRow & { variants: VariantRow | null })[];
};

export type GetShopSingleOfferPayload = {
  offers: OfferWithJoins;
  carts: CartRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartitems: (CartItemRow & { variants: VariantRow | null })[];
  consumerShop12M: ConsumerShop12mRow | null;
  counterOffers: CounterOfferRow | null;
};


export const OfferStatusEnum = {
  AutoAccepted: 'Auto Accepted' as const,
  AutoDeclined: 'Auto Declined' as const,
  PendingReview: 'Pending Review' as const,
  ConsumerAccepted: 'Consumer Accepted' as const,
  ConsumerDeclined: 'Consumer Declined' as const,
  ReviewedAccepted: 'Reviewed Accepted' as const,
  ReviewedCountered: 'Reviewed Countered' as const,
  ReviewedDeclined: 'Reviewed Declined' as const,
  AcceptedExpired: 'Accepted Expired' as const,
  CounterAcceptedExpired: 'Counter Accepted Expired' as const,
  CounteredWithdrawn: 'Countered Withdrawn' as const,
  RequiresApproval: 'Requires Approval' as const,
  ConsumerCountered: 'Consumer Countered' as const,
  DeclinedConsumerCounter: 'Declined Consumer Counter' as const,
  AcceptedConsumerCounter: 'Accepted Consumer Counter' as const,
};

export const ProgramStatusEnum ={
  Draft: 'Draft' as const, 
  Pending: 'Pending' as const, 
  Active: 'Active' as const, 
  Paused: 'Paused' as const, 
  Complete: 'Complete' as const, 
  Archived: 'Archived' as const

}

export type OfferStatusType = typeof OfferStatusEnum[keyof typeof OfferStatusEnum];
export type PrgoramStatusType = typeof ProgramStatusEnum[keyof typeof ProgramStatusEnum];