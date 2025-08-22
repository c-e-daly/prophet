import { NodeWorker } from "inspector/promises";
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
  status: string | "Draft";
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
  status: string | "Draft";
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

export const CampaignGoalTypeValues = [
  "Gross Margin",
  "Average Order Value",
  "New Customers",
  "Reactivate Customers",
  "Increase LTV",
  "Conversion Rate",
  "Category Sell Through",
  "Unit Volume",
  "Transaction Volume",
  "Other",
] as const;

export type CampaignGoalType = typeof CampaignGoalTypeValues[number];


export const CampaignMetricValues = [
  "Consumers", 
  "Orders", 
  "Units", 
  "Bundles", 
  "Items",
  "Dollars"
] as const;
export type CampaignMetric = typeof CampaignMetricValues[number];


export type CampaignGoal = {
  goal: CampaignGoalType;
  metric: CampaignMetric;
  value: number;
};


export const CampaignStatusValues = [
  "Draft",
  "Pending",
  "Active",
  "Paused",
  "Complete",
  "Archived",
] as const;
export type CampaignStatus = typeof CampaignStatusValues[number];