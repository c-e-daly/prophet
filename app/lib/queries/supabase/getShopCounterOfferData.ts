// app/lib/queries/supabase/getCounterOfferEditorData.ts

import createClient from "../../../../supabase/server";
import type { Tables, Inserts } from "../../types/dbTables";

// ✅ Type aliases from YOUR actual database schema
export type CartRow = Tables<"carts">;
export type OfferRow = Tables<"offers">;
export type ConsumerRow = Tables<"consumers">;
export type CounterOfferRow = Tables<"counterOffers">;
export type CounterOfferInsert = Inserts<"counterOffers">;
export type ConsumerShop12MRow = Tables<"consumerShop12m">; // This is a VIEW

export type CounterOfferEditorData = {
  offers: OfferRow;
  carts: CartRow;
  cartItems: any[]; // JSONB from offers.cartItems
  consumers: ConsumerRow;
  consumerShop12M: ConsumerShop12MRow | null;
  counterOffers: CounterOfferRow | null;
};

/**
 * Fetches all data needed for the counter offer editor
 */
export async function getCounterOfferEditorData(
  shopsID: number,
  counterOfferId?: number,
  offersID?: number
): Promise<CounterOfferEditorData> {
  const supabase = createClient();
  
  let offers: OfferRow;
  let carts: CartRow;
  let cartItems: any[] = [];
  let consumers: ConsumerRow;
  let consumerShop12M: ConsumerShop12MRow | null = null;
  let counterOffers: CounterOfferRow | null = null;
  
  // Step 1: Get counter offer if editing
  if (counterOfferId) {
    const { data: counterOfferData, error: counterOfferError } = await supabase
      .from("counterOffers")
      .select("*")
      .eq("id", counterOfferId)
      .eq("shops", shopsID)  // ✅ shops not shop
      .single();
    
    if (counterOfferError) {
      throw new Error(`Failed to fetch counter offer: ${counterOfferError.message}`);
    }
    
    if (!counterOfferData) {
      throw new Error("Counter offer not found");
    }
    
    counterOffers = counterOfferData;
    offersID = counterOfferData.offers;  // ✅ offers not offer
  }
  
  if (!offersID) {
    throw new Error("Either counterOfferId or offersID must be provided");
  }
  
  // Step 2: Get the offer
  const { data: offerData, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offersID)
    .eq("shops", shopsID)  // ✅ shops not shop
    .single();
  
  if (offerError) {
    throw new Error(`Failed to fetch offer: ${offerError.message}`);
  }
  
  if (!offerData) {
    throw new Error("Offer not found");
  }
  
  offers = offerData;
  
  // ✅ cartItems is JSONB on offers table, not separate table
  cartItems = offers.cartItems || [];
  
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
    
    // Step 5: Get consumerShop12m (materialized VIEW)
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
 * Upserts a counter offer - uses EXACT column names from database
 */
export async function upsertCounterOffer(data: {
  id?: number;
  shops: number;  // ✅ shops not shop
  offers: number;  // ✅ offers not offer
  counterType: string;
  counterConfig: any;
  counterOfferPrice: number;  // ✅ Required field
  headline?: string;
  description?: string;
  internalNotes?: string;  // ✅ internalNotes not internal_notes
  createdByUser: number;  // ✅ createdByUser not created_by_user_id
  offerStatus?: string;  // ✅ offerStatus not status
}): Promise<CounterOfferRow> {
  const supabase = createClient();
  
  const now = new Date().toISOString();
  
  // ✅ Map to EXACT database column names
  const counterOfferData: Partial<CounterOfferInsert> = {
    shops: data.shops,
    offers: data.offers,
    counterType: data.counterType,
    counterConfig: data.counterConfig,
    counterOfferPrice: data.counterOfferPrice,
    headline: data.headline || null,
    description: data.description || null,
    internalNotes: data.internalNotes || null,
    offerStatus: (data.offerStatus as any) || "Reviewed Countered",
    createdByUser: data.createdByUser,
    modifiedDate: now,  // ✅ modifiedDate not updated_date
  };
  
  if (data.id) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("counterOffers")
      .update(counterOfferData)
      .eq("id", data.id)
      .eq("shops", data.shops)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update counter offer: ${error.message}`);
    }
    
    return updated;
  } else {
    // Insert new
    const insertData: Partial<CounterOfferInsert> = {
      ...counterOfferData,
      createDate: now,  // ✅ createDate not created_date
    };
    
    const { data: inserted, error } = await supabase
      .from("counterOffers")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create counter offer: ${error.message}`);
    }
    
    return inserted;
  }
}