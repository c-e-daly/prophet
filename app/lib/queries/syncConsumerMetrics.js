import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUBBLE_API_URL = "https://iwantthat.bubbleapps.io/api/1.1/obj/consumer_metrics?limit=1000";
const BUBBLE_API_KEY = process.env.BUBBLE_API_KEY || "";

// Replace this with your real Shopify shop domain mappings
const merchantShopMap = {
  "1736437663760xabcde": "coolstore.myshopify.com",
  "merchant-id-xyz": "another-store.myshopify.com",
};

export const syncConsumerMetrics = async () => {
  console.log("🔄 Syncing Consumer Metrics from Bubble...");

  const response = await fetch(BUBBLE_API_URL, {
    headers: {
      Authorization: `Bearer ${BUBBLE_API_KEY}`,
    },
  });

  const { response: { results = [] } = {} } = await response.json();

  for (const record of results) {
    const shopDomain = merchantShopMap[record.merchant];

    if (!shopDomain) {
      console.warn(`⚠️ No Shopify domain mapping for Bubble merchant: ${record.merchant}`);
      continue;
    }

    const data = {
      iwt_consumer_id: record._id,
      consumer_id: record.consumers,
      shop_domain: shopDomain,
      first_purchase_date: record.firstPurchaseDate,
      last_purchase_date: record.lastPurchaseDate,
      cy_gross_revenue: record.cyGrossSales,
      cy_gross_discounts: record.cyGrossDiscounts,
      cy_gross_returns: record.cyGrossReturns,
      cy_gross_units: record.cyGrossUnits,
      cy_gross_items: record.cyGrossItems,
      cy_gross_ship_cost: record.cyGrossShipCost,
      cy_gross_shrink_cost: record.cyShrinkCost,
      cy_gross_finance_cost: record.cyGrossFinanceCost,
      cy_orders: record.cyOrders,
      cy_profit_markup: record.cyProfitMarkup,
      py_gross_revenue: record.pyGrossSales,
      py_gross_discounts: record.pyGrossDiscounts,
      py_gross_returns: record.pyReturnSales,
      py_gross_units: record.pyGrossUnits,
      py_gross_items: record.pyGrossItems,
      py_gross_ship_cost: record.pyGrossShipCost,
      py_gross_shrink_cost: record.pyGrossShrinkCost,
      py_gross_finance_cost: record.pyGrossFinanceCost,
      py_profit_markup: record.pyProfitMarkup,
      py_cogs: record.pyCOGS,
      py_return_items: record.pyReturnItems,
      py_return_units: record.pyReturnUnits,
      py_stores_shopped: record.pyStoresShopped,
      py_categories_shopped: record.pyCategoriesShopped,
      cy_stores_shopped: record.cyStoresShopped,
    };

    const { error } = await supabase
      .from("consumer_metrics")
      .upsert(data, { onConflict: "iwt_consumer_id" });

    if (error) {
      console.error(`❌ Failed to upsert record ${record._id}:`, error);
    } else {
      console.log(`✅ Upserted consumer: ${record._id}`);
    }
  }

  console.log("🎉 Sync complete.");
};
