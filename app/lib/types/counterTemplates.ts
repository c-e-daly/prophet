// app/lib/types/counterTemplates.ts

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
  shopsID: number;
  
  // Identity
  name: string;
  description: string;
  category: CounterTemplateCategory;
  
  // Counter strategy (with nulls = placeholders)
  type: string; // CounterType from counterOffers.ts
  config: any; // JSONB - same shape as CounterConfig but with nulls
  
  // Targeting rules
  target?: PortfolioType[];
  minCartValueCents?: number;
  maxCartValueCents?: number;
  minMarginPercent?: number;
  
  // Business rules
  maxDiscountPercent?: number;
  requiresApproval: boolean;
  
  // Customer-facing defaults
  headline: string;
  message: string;
  
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
};