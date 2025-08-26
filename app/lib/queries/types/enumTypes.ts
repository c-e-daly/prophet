import { NodeWorker } from "inspector/promises";
import { NullableCoordinate } from "recharts/types/util/types";


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

export const ProgramStatusValues = [
  "Draft",
  "Pending",
  "Active",
  "Paused",
  "Complete",
  "Archived",
] as const;
export type ProgramStatus = typeof ProgramStatusValues[number];