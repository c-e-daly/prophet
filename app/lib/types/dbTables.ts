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

export function getEnumValues<T extends string>(enumObj: Record<string, T>): T[] {
  return Object.values(enumObj);}

export type ConsumerShop12MRow = Views<'consumerShop12m'>;
export type CampaignInsert = Inserts<'campaigns'>;
export type CampaignUpdate = Updates<'campaigns'>;
export type CampaignStatus = Enum<'campaignStatus'>;

export const CampaignStatusEnum = {
  Draft: 'Draft' as const,
  Active: 'Active' as const,
  Paused: 'Paused' as const,
  Complete: 'Complete' as const,
  Archived: 'Archived' as const,
};

export type CampaignStatusType = typeof CampaignStatusEnum[keyof typeof CampaignStatusEnum];

// Payload for creating/updating campaigns
export type UpsertCampaignPayload = {
  id?: number;  // If provided = update, if omitted = insert
  name: string;
  description?: string | null;
  codePrefix?: string | null;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: CampaignStatus;
  goals?: any;  // Match your jsonb structure
  isDefault?: boolean;
  createdByUser: number | undefined;
  createdByUserName: string | undefined;
};

// Campaign with nested programs
export type CampaignWithPrograms = CampaignRow & {
  programs: ProgramRow[];};
export type ProgramInsert = Inserts<'programs'>;
export type ProgramUpdate = Updates<'programs'>;


// Payload for creating/updating programs
export type UpsertProgramPayload = {
  id?: number;  // If provided = update, if omitted = insert
  campaigns?: number;  // FK to campaigns
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: ProgramStatusType;
  budgetGoal?: number | null;
  offerGoal?: number | null;
  revenueGoal?: number | null;
  isDefault?: boolean;
  createdByUser: number | undefined;
  createdByUserName: string | undefined;
  // Add other program fields as needed
};

// Program with parent campaign
export type ProgramWithCampaign = Omit<ProgramRow, 'campaigns'> & {
  campaigns: Pick<CampaignRow, "id" | "name" | "startDate" | "endDate" | "status">;
};

export type CounterOfferUpdate = Updates<'counterOffers'>;
export type CounterOfferStatus = Enum<'offerStatus'>;

export const CounterOfferStatusEnum = {
  Draft: 'draft' as const,
  PendingApproval: 'pending_approval' as const,
  Sent: 'sent' as const,
  Accepted: 'accepted' as const,
  Rejected: 'rejected' as const,
  Expired: 'expired' as const,
  Withdrawn: 'withdrawn' as const,
};

export type CounterOfferStatusType = typeof CounterOfferStatusEnum[keyof typeof CounterOfferStatusEnum];

// Counter offer types from your architecture doc
export type CounterType = 
  | 'percent_off_item'
  | 'percent_off_order'
  | 'percent_off_next_order'
  | 'price_markdown'
  | 'price_markdown_order'
  | 'bounceback_current'
  | 'bounceback_future'
  | 'threshold_one'
  | 'threshold_two'
  | 'purchase_with_purchase'
  | 'gift_with_purchase'
  | 'flat_shipping'
  | 'free_shipping'
  | 'flat_shipping_upgrade'
  | 'price_markdown_per_unit'
  | 'price_markdown_bundle';

// Add counter offer payload if you need it
export type UpsertCounterOfferPayload = {
  id?: number;
  offer: number;  // FK to offers
  counterType: CounterType;
  counterConfig: any;  // JSONB - structure depends on counterType
  totalDiscountCents?: number;
  finalAmountCents: number;
  estimatedMarginPercent?: number;
  estimatedMarginCents?: number;
  predictedAcceptanceProbability?: number;
  headline?: string;
  description?: string;
  status?: CounterOfferStatusType;
  expiresAt?: string;
  // Add other counter offer fields as needed
};

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
  carts: CartRow;
  offers: OfferRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartItems: CartItemWithData[];  // Note: cartItems not items
  consumerShop12M: ConsumerShop12mRow | null;
  consumerShopCPM: ConsumerShopCPMRow | null;
  consumerShopCPMS: ConsumerShopCPMSRow | null;
  consumerShopLTV: ConsumerShopLTVRow | null;
  counterOffers: CounterOfferRow[];  // Make
}


export type OfferWithJoins = OfferRow & {
  carts: CartRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartItems: (CartItemRow & { variants: VariantRow | null })[];
};


// Update this type definition:
export type ShopSingleOfferPayload = {
  offers: OfferWithJoins;
  carts: CartRow | null;
  consumers: ConsumerRow | null;
  campaigns: CampaignRow | null;
  programs: ProgramRow | null;
  cartItems: CartItemWithData[];  
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

export const PROGRAM_GOAL_OPTIONS: EnumOption[] = [
  { label: "Gross Margin", value: "Gross Margin" },
  { label: "Average Order Value", value: "Average Order Value" },
  { label: "New Customers", value: "New Customers" },
  { label: "Conversion Rate", value: "Conversion Rate" },
  { label: "Unit Volume", value: "Unit Volume" }
];

// Goal metric options
export const GOAL_METRIC_OPTIONS: EnumOption[] = [
  { label: "Dollars", value: "Dollars" },
  { label: "Percent", value: "Percent" },
  { label: "Consumers", value: "Consumers" },
  { label: "Orders", value: "Orders" },
  { label: "Units", value: "Units" }
];


type EnumOption = { label: string; value: string };


function enumToOptions<T extends Record<string, string>>(enumObj: T): EnumOption[] {
  return Object.values(enumObj).map(value => ({ label: value, value }));
}

// Pre-built option arrays for forms
export const CAMPAIGN_STATUS_OPTIONS = enumToOptions(CampaignStatusEnum);
export const PROGRAM_STATUS_OPTIONS = enumToOptions(ProgramStatusEnum);
export const CART_STATUS_OPTIONS = enumToOptions(CartStatusEnum);
export const OFFER_STATUS_OPTIONS = enumToOptions(OfferStatusEnum);
export const COUNTER_OFFER_STATUS_OPTIONS = enumToOptions(CounterOfferStatusEnum);

export type OfferStatusType = typeof OfferStatusEnum[keyof typeof OfferStatusEnum];
export type ProgramStatusType = typeof ProgramStatusEnum[keyof typeof ProgramStatusEnum];
export type CartStatusType = typeof CartStatusEnum[keyof typeof  CartStatusEnum];
