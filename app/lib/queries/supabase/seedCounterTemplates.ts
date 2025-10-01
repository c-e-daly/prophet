// app/lib/queries/supabase/counterTemplates/seedCounterTemplates.ts
import createClient from "../../../../supabase/server";
import type { CounterTemplate } from "../../types/counterTemplates";

export const DEFAULT_TEMPLATES = [
  {
    name: "Bounceback: Buy & Get Reward",
    category: "bounceback",
    description: "Customer spends X today, gets Y off their next Z purchase",
    type: "bounceback_future",
    config: {
      type: "bounceback_future",
      spend_threshold_cents: null, // Placeholder
      reward_cents: null,
      next_order_threshold_cents: null,
      validity_days: 60,
      from_date: "order_date"
    },
    headline: "Spend ${{spend}}, get ${{reward}} off your next ${{next_threshold}}+",
    message: "Complete this order for ${{spend}} or more, and receive ${{reward}} off your next order of ${{next_threshold}} or more within {{validity_days}} days.",
    target: ['declining', 'reactivated', 'stable'],
    isActive: true,
    isDefault: true,
    requiresManagerApproval: false,
    timesUsed: 0,
    timesAccepted: 0,
  },
  
  {
    name: "Tiered Discount: Spend More, Save More",
    category: "threshold",
    description: "Multi-tier percentage discounts based on cart value",
    type: "threshold_two",
    config: {
      type: "threshold_two",
      thresholds: [
        { min_spend_cents: null, discount_percent: null },
        { min_spend_cents: null, discount_percent: null },
        { min_spend_cents: null, discount_percent: null }
      ]
    },
    headline: "{{tier1_percent}}% off ${{tier1_spend}}+ • {{tier2_percent}}% off ${{tier2_spend}}+ • {{tier3_percent}}% off ${{tier3_spend}}+",
    message: "Spend more, save more! Get {{tier1_percent}}% off orders ${{tier1_spend}}+, {{tier2_percent}}% off orders ${{tier2_spend}}+, or {{tier3_percent}}% off orders ${{tier3_spend}}+",
    target: ['growth', 'stable'],
    minCartValueCents: 5000,
    isActive: true,
    isDefault: false,
    requiresManagerApproval: false,
    timesUsed: 0,
    timesAccepted: 0,
  },
  
  {
    name: "Dollar Off Thresholds",
    category: "threshold",
    description: "Fixed dollar discounts at spending thresholds",
    type: "threshold_two",
    config: {
      type: "threshold_two",
      thresholds: [
        { min_spend_cents: null, discount_cents: null },
        { min_spend_cents: null, discount_cents: null }
      ]
    },
    headline: "${{tier1_discount}} off ${{tier1_spend}}+ or ${{tier2_discount}} off ${{tier2_spend}}+",
    message: "Get ${{tier1_discount}} off when you spend ${{tier1_spend}} or more, or get ${{tier2_discount}} off when you spend ${{tier2_spend}} or more!",
    target: ['new', 'reactivated', 'stable'],
    isActive: true,
    isDefault: false,
    requiresManagerApproval: false,
    timesUsed: 0,
    timesAccepted: 0,
  },
  
  {
    name: "Quantity Discount",
    category: "multi_unit",
    description: "Discounts based on quantity purchased",
    type: "price_markdown_per_unit",
    config: {
      type: "price_markdown_per_unit",
      quantity_tiers: [
        { min_quantity: 1, discount_percent: null },
        { min_quantity: null, discount_percent: null }
      ]
    },
    headline: "Buy {{qty1}}+ get {{discount1}}% off • Buy {{qty2}}+ get {{discount2}}% off",
    message: "Stock up and save! Buy {{qty1}} or more and get {{discount1}}% off, or buy {{qty2}} or more and get {{discount2}}% off!",
    target: ['growth', 'stable'],
    isActive: true,
    isDefault: false,
    requiresManagerApproval: false,
    timesUsed: 0,
    timesAccepted: 0,
  },
  
  {
    name: "Gift with Purchase",
    category: "gwp",
    description: "Free gift when customer hits spending threshold",
    type: "gift_with_purchase",
    config: {
      type: "gift_with_purchase",
      min_spend_cents: null,
      gift_product_id: null,
      gift_value_cents: null
    },
    headline: "Spend ${{threshold}}+ and get a FREE {{gift_name}} (${{gift_value}} value)!",
    message: "Complete your order of ${{threshold}} or more and receive a complimentary {{gift_name}} (valued at ${{gift_value}})!",
    target: ['new', 'stable', 'growth'],
    minCartValueCents: 10000,
    isActive: true,
    isDefault: false,
    requiresManagerApproval: false,
    timesUsed: 0,
    timesAccepted: 0,
  }
] as const;

/**
 * Seed default counter templates for a shop (run once during onboarding)
 */
export async function seedCounterTemplates(shopsID: number) {
  const supabase = createClient();
  
  const templates = DEFAULT_TEMPLATES.map(t => ({
    shops: shopsID,
    name: t.name,
    category: t.category,
    description: t.description,
    type: t.type,
    config: t.config,
    headline: t.headline,
    message: t.message,
    target: t.target,
    minCartValueCents: t.minCartValueCents || null,
    isActive: t.isActive,
    isDefault: t.isDefault,
    requiresManagerApproval: t.requiresManagerApproval,
    timesUsed: t.timesUsed,
    timesAccepted: t.timesAccepted,
    createdByUser: null, // System-created
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  const { data, error } = await supabase
    .from('counterTemplates')
    .insert(templates)
    .select();
  
  if (error) throw error;
  return data;
}

