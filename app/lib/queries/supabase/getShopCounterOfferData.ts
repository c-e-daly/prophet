// app/lib/queries/supabase/getCounterOfferEditorData.ts

import createClient from "../../../../supabase/server";

export type CounterOfferEditorData = {
  offer: any;
  cart: any;
  cartItems: any[];
  consumer: any;
  consumerShop12M: any;
  counterOffer: any | null;
};

/**
 * Fetches all data needed for the counter offer editor in multiple queries
 * Handles both "new" counter offer creation and editing existing counter offers
 */
export async function getCounterOfferEditorData(
  shopsID: number,
  counterOfferId?: number, // If provided, we're editing
  offersID?: number // If provided (and no counterOfferId), we're creating new
): Promise<CounterOfferEditorData> {
  const supabase = createClient();
  
  let offer: any;
  let cart: any;
  let cartItems: any[] = [];
  let consumer: any;
  let consumerShop12M: any = null;
  let counterOffer: any | null = null;
  
  // Step 1: Get the offer (either from counterOffer or directly)
  if (counterOfferId) {
    // Editing existing counter offer - get the counter offer first
    const { data: counterOfferData, error: counterOfferError } = await supabase
      .from("counterOffers")
      .select("*")
      .eq("id", counterOfferId)
      .eq("shops", shopsID)
      .single();
    
    if (counterOfferError) {
      throw new Error(`Failed to fetch counter offer: ${counterOfferError.message}`);
    }
    
    if (!counterOfferData) {
      throw new Error("Counter offer not found");
    }
    
    counterOffer = counterOfferData;
    offersID = counterOfferData.offers; // Get the offer ID from counter offer
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
  
  offer = offerData;
  
  // Step 3: Get the cart using carts ID from offer
  if (offer.carts) {
    const { data: cartData, error: cartError } = await supabase
      .from("carts")
      .select("*")
      .eq("id", offer.carts)
      .single();
    
    if (cartError) {
      throw new Error(`Failed to fetch cart: ${cartError.message}`);
    }
    
    cart = cartData;
    
    // cartItems is JSONB on the cart, not a separate table
    cartItems = cart?.cartItems || [];
  }
  
  // Step 4: Get the consumer
  if (offer.consumers) {
    const { data: consumerData, error: consumerError } = await supabase
      .from("consumers")
      .select("*")
      .eq("id", offer.consumers)
      .single();
    
    if (consumerError) {
      throw new Error(`Failed to fetch consumer: ${consumerError.message}`);
    }
    
    consumer = consumerData;
    
    // Step 5: Get consumerShop, then consumerShop12M
    const { data: consumerShopData, error: consumerShopError } = await supabase
      .from("consumerShop")
      .select("*")
      .eq("consumers", consumer.id)
      .eq("shops", shopsID)
      .single();
    
    if (consumerShopError) {
      // Don't throw, just leave as null - consumer might not have shop data yet
      console.warn(`No consumerShop data: ${consumerShopError.message}`);
    } else if (consumerShopData) {
      // Now get consumerShop12M
      const { data: consumerShop12MData, error: consumerShop12MError } = await supabase
        .from("consumerShop12M")
        .select("*")
        .eq("id", consumerShopData.consumerShop12M)
        .single();
      
      if (consumerShop12MError) {
        console.warn(`No consumerShop12M data: ${consumerShop12MError.message}`);
      } else {
        consumerShop12M = consumerShop12MData;
      }
    }
  }
  
  return {
    offer,
    cart,
    cartItems,
    consumer,
    consumerShop12M,
    counterOffer,
  };
}

/**
 * Upserts a counter offer (creates new or updates existing)
 */
export async function upsertCounterOffer(
  data: {
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
  }
) {
  const supabase = createClient();
  
  const now = new Date().toISOString();
  
  const counterOfferData = {
    shops: data.shop, // Column is "shops" not "shop"
    offers: data.offer, // Column is "offers" not "offer"
    counterType: data.counter_type, // Match your actual column name
    counterConfig: data.counter_config, // Match your actual column name
    headline: data.headline,
    description: data.description,
    internalNotes: data.internal_notes, // Match your actual column name
    counterOfferStatus: data.status || "sent", // Match your actual column name
    createdByUser: data.created_by_user_id, // Match your actual column name
    updatedDate: now,
    ...(data.id ? {} : { createdDate: now }), // Only set createdDate on insert
  };
  
  if (data.id) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("counterOffers")
      .update(counterOfferData)
      .eq("id", data.id)
      .eq("shops", data.shop)
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