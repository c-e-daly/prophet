// app/lib/types/counterTypes.ts
import type { Database } from "../../../supabase/database.types";

// Main enum from database
export type CounterType = Database["public"]["Enums"]["counterTypes"];

export type CounterOfferStatus = Database["public"]["Enums"]["counterOfferStatus"];

// Base config structure - ALL configs
export type CounterConfig = 
  | PercentOffItemConfig
  | PercentOffOrderConfig
  | PercentOffNextOrderConfig
  | PriceMarkdownConfig
  | PriceMarkdownOrderConfig
  | BouncebackCurrentConfig
  | BouncebackFutureConfig
  | ThresholdOneConfig
  | ThresholdTwoConfig
  | PurchaseWithPurchaseConfig
  | GiftWithPurchaseConfig
  | FlatShippingConfig
  | FreeShippingConfig
  | FlatShippingUpgradeConfig
  | PriceMarkdownPerUnitConfig
  | PriceMarkdownBundleConfig;

// Individual config types (keep all your existing ones)
export type PercentOffItemConfig = {
  type: "percent_off_item";
  percent: number;
  item_ids?: number[];
};

export type PercentOffOrderConfig = {
  type: "percent_off_order";
  percent: number;
};

export type PercentOffNextOrderConfig = {
  type: "percent_off_next_order";
  percent: number;
  validity_days: number;
};

export type PriceMarkdownConfig = {
  type: "price_markdown";
  markdown_cents: number;
  item_ids?: number[];
};

export type PriceMarkdownOrderConfig = {
  type: "price_markdown_order";
  markdown_cents: number;
};

export type BouncebackCurrentConfig = {
  type: "bounceback_current";
  spend_threshold_cents: number;
  reward_cents: number;
  validity_days: number;
};

export type BouncebackFutureConfig = {
  type: "bounceback_future";
  next_order_threshold_cents: number;
  reward_cents: number;
  validity_days: number;
  from_date: "order_date" | "counter_accepted";
};

export type ThresholdOneConfig = {
  type: "threshold_one";
  thresholds: Array<{
    min_spend_cents: number;
    discount_percent: number;
  }>;
};

export type ThresholdTwoConfig = {
  type: "threshold_two";
  thresholds: Array<{
    min_spend_cents: number;
    discount_percent: number;
  }>;
};

export type PurchaseWithPurchaseConfig = {
  type: "purchase_with_purchase";
  required_product_ids: number[];
  bonus_product_id: number;
  bonus_price_cents: number;
};

export type GiftWithPurchaseConfig = {
  type: "gift_with_purchase";
  required_spend_cents: number;
  gift_product_id: number;
};

export type FlatShippingConfig = {
  type: "flat_shipping";
  shipping_cost_cents: number;
};

export type FreeShippingConfig = {
  type: "free_shipping";
};

export type FlatShippingUpgradeConfig = {
  type: "flat_shipping_upgrade";
  upgrade_method: string;
  upgrade_cost_cents: number;
};

export type PriceMarkdownPerUnitConfig = {
  type: "price_markdown_per_unit";
  markdown_cents_per_unit: number;
  item_ids?: number[];
};

export type PriceMarkdownBundleConfig = {
  type: "price_markdown_bundle";
  markdown_cents: number;
  bundle_quantity: number;
  item_ids: number[];
};