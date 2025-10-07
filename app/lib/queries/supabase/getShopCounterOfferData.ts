// app/lib/queries/supabase/getCounterOfferEditorData.ts

import createClient from "../../../../supabase/server";

export type CounterOfferEditorData = {
  offers: any;
  carts: any;
  cartItems: any[];
  consumers: any;
  consumerShop12M: any;
  counterOffers: any | null;
};

/**
 * Fetches all data needed for the counter offer editor
 * Handles both "new" counter offer creation and editing existing counter offers
 */
export async function getCounterOfferEditorData(
  shopsID: number,
  counterOfferId?: number,
  offersID?: number
): Promise<CounterOfferEditorData> {
  const supabase = createClient();
  
  let offers: any;
  let carts: any;
  let cartItems: any[] = [];
  let consumers: any;
  let consumerShop12M: any = null;
  let counterOffers: any | null = null;
  
  // Step 1: Get counter offer if editing
  if (counterOfferId) {
    const { data: counterOfferData, error: counterOfferError } = await supabase
      .from("counterOffers") // ✅ Correct camelCase
      .select("*")
      .eq("id", counterOfferId)
      .eq("shop", shopsID)
      .single();
    
    if (counterOfferError) {
      throw new Error(`Failed to fetch counter offer: ${counterOfferError.message}`);
    }
    
    if (!counterOfferData) {
      throw new Error("Counter offer not found");
    }
    
    counterOffers = counterOfferData;
    offersID = counterOfferData.offers;
  }
  
  if (!offersID) {
    throw new Error("Either counterOfferId or offersID must be provided");
  }
  
  // Step 2: Get the offer
  const { data: offerData, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offersID)
    .eq("shops", shopsID)
    .single();
  
  if (offerError) {
    throw new Error(`Failed to fetch offer: ${offerError.message}`);
  }
  
  if (!offerData) {
    throw new Error("Offer not found");
  }
  
  offers = offerData;
  
  // Step 3: Get the cart
  if (offers.carts) {
    const { data: cartData, error: cartError } = await supabase
      .from("carts")
      .select("*")
      .eq("id", offers.carts)
      .single();
    
    if (cartError) {
      throw new Error(`Failed to fetch cart: ${cartError.message}`);
    }
    
    carts = cartData;
    cartItems = carts?.cartItems || [];
  }
  
  // Step 4: Get the consumer
  if (offers.consumers) {
    const { data: consumerData, error: consumerError } = await supabase
      .from("consumers")
      .select("*")
      .eq("id", offers.consumers)
      .single();
    
    if (consumerError) {
      throw new Error(`Failed to fetch consumer: ${consumerError.message}`);
    }
    
    consumers = consumerData;
    
    // Step 5: Get consumerShop12m (materialized view - lowercase 'm')
    const { data: consumerShop12mData, error: consumerShop12mError } = await supabase
      .from("consumerShop12m")
      .select("*")
      .eq("consumers", consumers.id)
      .eq("shops", shopsID)
      .maybeSingle();
    
    if (consumerShop12mError) {
      console.warn(`No consumerShop12m data: ${consumerShop12mError.message}`);
    } else {
      consumerShop12M = consumerShop12mData;
    }
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
export async function upsertCounterOffer(data: {
  id?: number;
  shop: number;
  offer: number;
  counter_type: string;
  counter_config: any;
  headline?: string;
  description?: string;
  internal_notes?: string;
  created_by_user_id: number;
  status?: string;
}) {
  const supabase = createClient();
  
  const now = new Date().toISOString();
  
  const counterOfferData: any = {
    shop: data.shop,
    offer: data.offer,
    counter_type: data.counter_type,
    counter_config: data.counter_config,
    headline: data.headline || null,
    description: data.description || null,
    internal_notes: data.internal_notes || null,
    status: data.status || "sent",
    created_by_user_id: data.created_by_user_id,
    updated_date: now,
  };
  
  if (data.id) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("counterOffers") // ✅ Correct camelCase
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
    counterOfferData.created_date = now;
    
    const { data: inserted, error } = await supabase
      .from("counterOffers") // ✅ Correct camelCase
      .insert(counterOfferData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create counter offer: ${error.message}`);
    }
    
    return inserted;
  }
}