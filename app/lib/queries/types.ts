// app/lib/types.ts
export type Campaign = {
  id: number;
  shop: number;
  name: string;
  description: string | null;
  code_prefix: string | null;
  budget: number | null;
  start_date: string | null; // ISO
  end_date: string | null;   // ISO
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  goals?: Array<{ type: string; metric: string; value: number }>;
  created_date?: string | null;
  modified_date?: string | null;
};

export type Program = {
  id: number;
  shop: number;
  campaign: number;
  name: string;
  type: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  start_date: string | null;
  end_date: string | null;
};

export type CounterOffer = {
  id: number;
  shop: number;
  offer: number; // FK to offers.id
  amount_cents: number;
  reason?: string | null;
  created_date?: string | null;
};
