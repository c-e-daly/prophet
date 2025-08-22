import { NullableCoordinate } from "recharts/types/util/types";

// app/lib/types.ts
export type Campaign = {
  id: number;
  shop: number;
  campaignName: string | null;
  description: string | null;
  codePrefix: string | null;
  budget: number | null;
  startDate: string | null; // ISO
  endDate: string | null;   // ISO
  status: string | "DRAFT";
  goals?: Array<{ type: string; metric: string; value: number }>;
  created_date?: string | null;
  modifiedDate?: string | null;
  isDefault: boolean;
};

export type Program = {
  id: number;
  shop: number;
  campaign: number;
  programName: string;
  type: string | null;
  status: string | "DRAFT";
  startDate: string | null;
  endDate: string | null;
  acceptRate: number | null;
  declineRate: number | null;
  combineProductDiscounts: boolean;
  combineShippingDiscounts: boolean;
  combineOrderDiscounts: boolean;
  expiryTimeMinutes: number | null;
  codePrefix: string | null;
  isDefault: boolean;
  programFocus: string | null;
};

export type CounterOffer = {
  id: number;
  shop: number;
  offer: number; // FK to offers.id
  amount_cents: number;
  reason?: string | null;
  created_date?: string | null;
};
