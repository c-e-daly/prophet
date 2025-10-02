// app/lib/queries/supabase/counterTemplates/createCounterTemplate.ts
import createClient from "../../../../supabase/server";
import type { CounterTemplate } from "../../types/counterTemplates";

type CreateCounterTemplateInput = Omit<CounterTemplate, 
'id' | 'usage' | 'accepted' | 'acceptRate' | 'createDate' | 'modifedDate'>;

export async function createCounterTemplate(input: CreateCounterTemplateInput) {
  const supabase = createClient();
  
  const row = {
    shops: input.shops,
    name: input.name,
    description: input.description,
    category: input.category,
    type: input.type,
    config: input.config,
    headline: input.headline,
    message: input.message,
    target: input.target || null,
    minCartValueCents: input.minCartValueCents || null,
    maxCartValueCents: input.maxCartValueCents || null,
    minMarginPercent: input.minMarginPercent || null,
    maxDiscountPercent: input.maxDiscountPercent || null,
    requiresApproval: input.requiresApproval,
    isActive: input.isActive,
    isDefault: input.isDefault,
    createdByUser: input.createdByUser || null,
    timesUsed: 0,
    timesAccepted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('counterTemplates')
    .insert(row)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}