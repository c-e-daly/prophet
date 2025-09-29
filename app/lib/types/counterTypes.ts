// app/lib/types/counterTypes.ts

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

// Config structures for each type
export type CounterConfig = 
  | PercentOffItemConfig
  | PercentOffOrderConfig
  | BouncebackCurrentConfig
  | BouncebackFutureConfig
  | ThresholdConfig
  | PurchaseWithPurchaseConfig
  | ShippingConfig
  | PriceMarkdownConfig;

export type PercentOffItemConfig = {
  type: 'percent_off_item';
  percent: number;  // 15 = 15% off
  item_ids?: number[];  // Specific items, or all if empty
};

export type PercentOffOrderConfig = {
  type: 'percent_off_order';
  percent: number;
};

export type BouncebackCurrentConfig = {
  type: 'bounceback_current';
  spend_threshold_cents: number;  // e.g., 10000 = $100
  reward_cents: number;  // e.g., 2000 = $20 off
  validity_days: number;  // 30
};

export type BouncebackFutureConfig = {
  type: 'bounceback_future';
  next_order_threshold_cents: number;  // Spend $100
  reward_cents: number;  // Get $50 off
  validity_days: number;  // Within 60 days
  from_date: 'order_date' | 'counter_accepted';
};

export type ThresholdConfig = {
  type: 'threshold_one' | 'threshold_two';
  thresholds: Array<{
    min_spend_cents: number;
    discount_percent: number;
  }>;
  // Example: [
  //   { min_spend_cents: 0, discount_percent: 10 },
  //   { min_spend_cents: 10000, discount_percent: 15 },
  //   { min_spend_cents: 20000, discount_percent: 20 }
  // ]
};

export type PurchaseWithPurchaseConfig = {
  type: 'purchase_with_purchase';
  required_product_ids: number[];
  bonus_product_id: number;
  bonus_price_cents: number;  // Discounted price for bonus
};

export type ShippingConfig = {
  type: 'flat_shipping' | 'free_shipping' | 'flat_shipping_upgrade';
  shipping_cost_cents?: number;  // For flat_shipping
  upgrade_method?: string;  // For shipping_upgrade
};

export type PriceMarkdownConfig = {
  type: 'price_markdown' | 'price_markdown_order' | 'price_markdown_per_unit' | 'price_markdown_bundle';
  markdown_cents: number;
  apply_to?: 'order' | 'item' | 'bundle';
  item_ids?: number[];
  bundle_quantity?: number;
};