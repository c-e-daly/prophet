import { NullableCoordinate } from "recharts/types/util/types";

// app/lib/types.ts
export type Campaign = {
  id: number;
  shop: number;
  camaign_name: string | null;
  description: string | null;
  code_prefix: string | null;
  budget: number | null;
  start_date: string | null; // ISO
  end_date: string | null;   // ISO
  status: string | "DRAFT";
  goals?: Array<{ type: string; metric: string; value: number }>;
  created_date?: string | null;
  modified_date?: string | null;
  isDefault: boolean;
};

export type Program = {
  id: number;
  shop: number;
  campaign: number;
  program_name: string;
  type: string | null;
  status: string | "DRAFT";
  start_date: string | null;
  end_date: string | null;
  program_accept_rate: number | null;
  program_decline_rate: number | null;
  combine_product_discounts: boolean;
  combine_shipping_discounts: boolean;
  combine_order_discounts: boolean;
  expiry_time_minutes: number | null;
  code_prefix: string | null;
  isDefault: boolean;
  program_focus: string | null;
};

export type CounterOffer = {
  id: number;
  shop: number;
  offer: number; // FK to offers.id
  amount_cents: number;
  reason?: string | null;
  created_date?: string | null;
};
