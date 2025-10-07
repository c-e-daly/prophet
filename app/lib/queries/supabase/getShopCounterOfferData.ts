// app/lib/queries/supabase/getCounterOfferEditorData.ts

import  createClient from "../../../../supabase/server";

export type CounterOfferEditorData = {
  offers: any; // Replace with your Offer type
  carts: any; // Replace with your Cart type
  cartItems: any[]; // Replace with your CartItem type
  consumers: any; // Replace with your Consumer type
  consumerShop12M: any; // Replace with your ConsumerShop12M type
  counterOffers: any | null; // Replace with your CounterOffer type (null if new)
};

/**
 * Fetches all data needed for the counter offer editor in a single query
 * Handles both "new" counter offer creation and editing existing counter offers
 */
export async function getCounterOfferEditorData(
  shopsID: number,
  counterOfferId?: number, // If provided, we're editing
  offersID?: number // If provided (and no counterOfferId), we're creating new
): Promise<CounterOfferEditorData> {
  const supabase = createClient();
  
  let offers: any;
  let carts: any;
  let cartItems: any[] = [];
  let consumers: any;
  let consumerShop12M: any;
  let counterOffers: any | null = null;
  
  // Scenario 1: Editing existing counter offer
  if (counterOfferId) {
    const { data, error } = await supabase
      .from("counterOffers")
      .select(`
        *,
        offers!counterOffers_offer_fkey (
          *,
          carts!carts_offersID_fkey (
            *,
            cartItems!cartItems_cartsID_fkey (*)
          ),
          consumers!offers_consumer_fkey (
            *,
            consumerShop12M!consumerShop12M_consumer_fkey (*)
          )
        )
      `)
      .eq("id", counterOfferId)
      .eq("shop", shopsID)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch counter offer: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Counter offer not found");
    }
    
    counterOffers = data;
    offers = data.offers;
    carts = data.offers.carts;
    cartItems = data.offers.carts?.cartItems || [];
    consumers = data.offers.consumers;
    consumerShop12M = data.offers.consumers?.consumerShop12M?.[0] || null;
  }
  // Scenario 2: Creating new counter offer from offer
  else if (offersID) {
    const { data, error } = await supabase
      .from("offers")
      .select(`
        *,
        carts!carts_offersID_fkey (
          *,
          cartItems!cartItems_cartsID_fkey (*)
        ),
        consumers!offers_consumer_fkey (
          *,
          consumerShop12M!consumerShop12M_consumer_fkey (*)
        )
      `)
      .eq("id", offersID)
      .eq("shop", shopsID)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch offer: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Offer not found");
    }
    
    offers = data;
    carts = data.carts;
    cartItems = data.carts?.cartItems || [];
    consumers = data.consumers;
    consumerShop12M = data.consumers?.consumerShop12M?.[0] || null;
  } else {
    throw new Error("Either counterOfferId or offerId must be provided");
  }
  
  return {
    offers,
    carts,
    cartItems,
    consumers,
    consumerShop12M,
    counterOffers,
  };
}

/**
 * Upserts a counter offer (creates new or updates existing)
 */
export async function upsertCounterOffer(
  data: {
    id?: number; // If provided, updates existing; otherwise creates new
    shop: number;
    offer: number;
    counter_type: string;
    counter_config: any;
    headline?: string;
    description?: string;
    internal_notes?: string;
    created_by_user_id: number;
    status?: string;
    // Add other fields as needed
  }
) {
  const supabase = createClient();
  
  const now = new Date().toISOString();
  
  const counterOfferData = {
    shop: data.shop,
    offer: data.offer,
    counter_type: data.counter_type,
    counter_config: data.counter_config,
    headline: data.headline,
    description: data.description,
    internal_notes: data.internal_notes,
    status: data.status || "sent",
    created_by_user_id: data.created_by_user_id,
    updated_date: now,
    ...(data.id ? {} : { created_date: now }), // Only set created_date on insert
  };
  
  if (data.id) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("counterOffers")
      .update(counterOfferData)
      .eq("id", data.id)
      .eq("shop", data.shop)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update counter offer: ${error.message}`);
    }
    
    return updated;
  } else {
    // Insert new
    const { data: inserted, error } = await supabase
      .from("counterOffers")
      .insert(counterOfferData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create counter offer: ${error.message}`);
    }
    
    return inserted;
  }
}