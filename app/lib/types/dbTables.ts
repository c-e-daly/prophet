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

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

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
export type VariantPricingRow = Tables<'variantPricing'>;
export type ConsumerShop12mRow = Database["public"]["Views"]["consumerShop12m"]["Row"];
export type ConsumerShopCPMRow = Tables<'consumerShopCPM'>;
export type ConsumerShopCPMSRow = Tables<'consumerShopCPMS'>;
export type CounterOfferInsert = Inserts<'counterOffers'>;
export type ConsumerShopLTVRow = Tables<'consumerShopLTV'>;

// Helper to get all enum values as an array
export function getEnumValues<T extends string>(enumObj: Record<string, T>): T[] {
  return Object.values(enumObj);
}

export type ConsumerShop12MRow = Views<'consumerShop12m'>;

export type CartItemPricing = {
  id: number;
  costPerUnit: number | null;
  msrp: number | null;
  compareAtPrice: number | null;
  profitPerUnit: number | null;
  profitMargin: number | null;
  updatedDate: string | null;
};

export type CartItemWithData = {
  cartItem: CartItemRow;
  variantPricing: VariantPricingRow | null;
};

export type CartDetailsPayload = {
  cart: CartRow;
  consumer: ConsumerRow | null;
  offer: OfferRow | null;
  program: ProgramRow | null;
  items: CartItemWithData[];
};

export type OfferWithJoins = OfferRow & {
  carts: CartRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartitems: (CartItemRow & { variants: VariantRow | null })[];
};

// app/lib/queries/types/dbTables.ts

// Update this type definition:
export type ShopSingleOfferPayload = {
  offers: OfferWithJoins;
  carts: CartRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartitems: (CartItemRow & { variants: VariantRow | null })[];
  consumerShop12M: ConsumerShop12mRow | null;
  consumerShopCPM: ConsumerShopCPMRow | null;    // ADD THIS
  consumerShopCPMS: ConsumerShopCPMSRow | null;  // ADD THIS
  consumerShopLTV: ConsumerShopLTVRow | null;    // ADD THIS
  counterOffers: CounterOfferRow | null;
};

export type GetShopCounterOfferEditPayload = {
  offers: OfferRow;
  carts: CartRow | null;
  cartItems: any[]; 
  consumers: ConsumerRow | null;
  consumerShop12M: ConsumerShop12mRow | null;
  consumerShopCPM?: ConsumerShopCPMRow | null;   // keep optional if table not always present
  consumerShopCPMS?: ConsumerShopCPMSRow | null; // same
  consumerShopLTV?: ConsumerShopLTVRow | null;   // same
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

export const CartStatusEnum ={
  Abandoned: 'Abandoned' as const, 
  Offered: 'Offered' as const, 
  Checkout: 'Checkout' as const, 
  ClosedWon: 'Closed-Won' as const, 
  ClosedLost: 'Closed-Lost' as const, 
  Expired: 'Expired' as const,
  Archived: 'Archived' as const

}

export type OfferStatusType = typeof OfferStatusEnum[keyof typeof OfferStatusEnum];
export type ProgramStatusType = typeof ProgramStatusEnum[keyof typeof ProgramStatusEnum];
export type CartStatusType = typeof CartStatusEnum[keyof typeof  CartStatusEnum];