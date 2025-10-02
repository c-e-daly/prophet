// app/lib/types/counterTemplates.ts
import type { CounterType, CounterConfig } from "./counterTypes";

export type CounterTemplateCategory = 
  | 'bounceback'
  | 'threshold'
  | 'multi_unit'
  | 'gwp'
  | 'percent_off'
  | 'shipping';

export type PortfolioType = 
  | 'new'
  | 'reactivated'
  | 'stable'
  | 'growth'
  | 'declining'
  | 'defected';

// Template (pre-configured strategy)
export type CounterTemplate = {
  id: number;
  shops: number;
  
  // Identity
  name: string;
  description: string;
  category: CounterTemplateCategory;
  
  // Counter strategy (with nulls = placeholders)
  type: CounterType;
  config: Partial<CounterConfig>; // Config with nullable fields for placeholders
  
  // Targeting rules
  target?: PortfolioType[];
  minCartValueCents?: number;
  maxCartValueCents?: number;
  minMarginPercent?: number;
  
  // Business rules
  maxDiscountPercent?: number;
  confidenceScore: number;
  
  // Customer-facing defaults
  headline: string;
  message: string;
  approvedByUser: number;
  
  // Usage tracking
  usage: number;
  accepted: number;
  acceptRate?: number;
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  
  // Metadata
  createdByUser?: number;
  createDate: string;
  modifiedDate: string;
  requiresApproval: boolean;
};

// Type for creating a new template
export type CreateCounterTemplateInput = {
  shopsID: number;
  name: string;
  description: string;
  category: CounterTemplateCategory;
  type: CounterType;
  config: any; // JSONB - allow any structure for flexibility
  headline: string;
  message: string;
  target?: PortfolioType[];
  minCartValueCents?: number;
  maxCartValueCents?: number;
  minMarginPercent?: number;
  maxDiscountPercent?: number;
  requiresApproval: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdByUser?: number;
};