// app/lib/queries/supabase/createShopCounterOffer.ts
import  createClient  from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";
import { CounterConfig, CounterType } from "../../types/counterTypes";

   export async function createShopCounterOffer(shopsID: number, data: {
     offersID: number;
     counterType: CounterType;
     counterConfig: CounterConfig;
     totalDiscountCents: number;
     finalAmountCents: number;
     estimatedMarginPercent: number;
     estimatedMarginCents: number;
     predictedAcceptanceProbability: number;
     description: string;
     internalNotes: string;
     createdByUserId: number;
   }) {
     const supabase = createClient();
     const { data: counter, error } = await supabase
       .from('counterOffers')
       .insert({ shops: shopsID, ...data })
       .select()
       .single();
     
     if (error) throw error;
     return counter;
   }
