// app/lib/constants/counterTypes.ts
import { CounterType } from "./counterTypes";

export const COUNTER_TYPE_LABELS: Record<CounterType, string> = {
  percent_off_item: "Percent Off Item",
  percent_off_order: "Percent Off Order",
  percent_off_next_order: "Percent Off Next Order",
  price_markdown: "Price Markdown",
  price_markdown_order: "Order Price Markdown",
  bounceback_current: "Spend & Save Today",
  bounceback_future: "Save On Next Order",
  threshold_one: "Tiered Discount",
  threshold_two: "Multi-Tier Discount",
  purchase_with_purchase: "Purchase with Purchase",
  gift_with_purchase: "Gift with Purchase",
  flat_shipping: "Flat Rate Shipping",
  free_shipping: "Free Shipping",
  flat_shipping_upgrade: "Upgraded Shipping",
  price_markdown_per_unit: "Per Unit Markdown",
  price_markdown_bundle: "Bundle Markdown",
};

export const COUNTER_TYPE_DESCRIPTIONS: Record<CounterType, string> = {
  percent_off_item: "Apply percentage discount to specific items",
  percent_off_order: "Apply percentage discount to entire order",
  percent_off_next_order: "Give discount code for their next purchase",
  price_markdown: "Reduce price by fixed dollar amount",
  price_markdown_order: "Reduce total order by fixed dollar amount",
  bounceback_current: "Reward spending threshold on this order",
  bounceback_future: "Incentivize next purchase with conditional discount",
  threshold_one: "Single-tier spend threshold reward",
  threshold_two: "Multi-tier spend thresholds with escalating rewards",
  purchase_with_purchase: "Buy X, get Y at special price",
  gift_with_purchase: "Free item with qualifying purchase",
  flat_shipping: "Charge flat shipping rate",
  free_shipping: "Waive all shipping charges",
  flat_shipping_upgrade: "Upgrade to faster shipping at flat rate",
  price_markdown_per_unit: "Discount per unit for quantity items",
  price_markdown_bundle: "Special price for bundled items",
};

// Category grouping for UI
export const COUNTER_TYPE_CATEGORIES = {
  'Immediate Discounts': [
    'percent_off_item',
    'percent_off_order',
    'price_markdown',
    'price_markdown_order',
  ],
  'Future Incentives': [
    'percent_off_next_order',
    'bounceback_future',
  ],
  'Spend Thresholds': [
    'bounceback_current',
    'threshold_one',
    'threshold_two',
  ],
  'Bundle Deals': [
    'purchase_with_purchase',
    'gift_with_purchase',
    'price_markdown_bundle',
  ],
  'Shipping': [
    'flat_shipping',
    'free_shipping',
    'flat_shipping_upgrade',
  ],
};