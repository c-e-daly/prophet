// app/lib/queries/supabase/getCounterTemplates.ts
import createClient from "../../../../supabase/server";

export async function getCounterTemplates(shopdID: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('counterTemplates')
    .select('*')
    .eq('shops', shopsI)
    .eq('isActive', true)
    .order('usage', { ascending: false }); // Most used first
  
  if (error) throw error;
  return data || [];
}

// app/lib/queries/supabase/createCounterTemplate.ts

export async function createCounterTemplate(template: any) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('counterTemplates')
    .insert(template)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}