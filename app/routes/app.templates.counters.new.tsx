// app/routes/app.templates.counter.new.tsx
import { useState } from "react";
import { Form, useActionData } from "@remix-run/react";
import { Page, Layout, Card, FormLayout, TextField, Select, Button, Banner, Text } from "@shopify/polaris";
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { createCounterTemplate } from "../lib/queries/supabase/createCounterTemplates";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

type CategoryKey = "bounceback" | "threshold" | "multi_unit" | "gwp" | "percent_off" | "shipping";

export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId } = await getAuthContext(request);
  const formData = await request.formData();
  
  // Parse the form data
  const template = {
    shops: shopsID,
    name: formData.get("template_name") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    type: formData.get("counter_type") as string,
    config: JSON.parse(formData.get("counter_config") as string),
    headline: formData.get("headline_template") as string,
    message: formData.get("description_template") as string,
    target: JSON.parse(formData.get("target_portfolios") as string || "[]"),
    minCartValueCents: formData.get("min_cart_value") ? Number(formData.get("min_cart_value")) : undefined,
    maxCartValueCents: formData.get("max_cart_value") ? Number(formData.get("max_cart_value")) : undefined,
    minMarginPercent: formData.get("min_margin") ? Number(formData.get("min_margin")) : undefined,
    maxDiscountPercent: formData.get("max_discount") ? Number(formData.get("max_discount")) : undefined,
    requiresManagerApproval: formData.get("requires_approval") === "true",
    isActive: true,
    isDefault: formData.get("is_default") === "true",
    createdByUser: currentUserId,
  };
  
  try {
    await createCounterTemplate(template);
    return redirect("/app/templates");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return json({ error: errorMessage }, { status: 400 });
  }
}

export default function NewCounterTemplate() {
  const actionData = useActionData<typeof action>();
  const [category, setCategory] = useState<CategoryKey>("bounceback");
  const [type, setType] = useState("bounceback_future");
  
  return (
    <Page title="Create Counter Offer Template" backAction={{ url: "/app/templates" }}>
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner tone="critical" title="Error creating template">
              <p>{actionData.error}</p>
            </Banner>
          )}
          
          <Form method="post">
            <Card>
              <FormLayout>
                <TextField
                  label="Template Name"
                  name="template_name"
                  autoComplete="off"
                  placeholder="Bounceback: Buy $100, Get $50 Next Order"
                  helpText="Internal name to identify this template"
                />
                
                <TextField
                  label="Description"
                  name="description"
                  multiline={3}
                  autoComplete="off"
                  placeholder="Encourages repeat purchases by offering future discount"
                  helpText="What is this template for?"
                />
                
                <Select
                  label="Category"
                  name="category"
                  value={category}
                  onChange={(val) => setCategory(val as CategoryKey)}
                  options={[
                    { label: "Bounceback", value: "bounceback" },
                    { label: "Threshold Discount", value: "threshold" },
                    { label: "Quantity Discount", value: "multi_unit" },
                    { label: "Gift with Purchase", value: "gwp" },
                    { label: "Percent Off", value: "percent_off" },
                    { label: "Free Shipping", value: "shipping" },
                  ]}
                />
                
                <Select
                  label="Counter Type"
                  name="counter_type"
                  value={type}
                  onChange={setType}
                  options={getCounterTypeOptions(category)}
                  helpText="Technical implementation type"
                />
                
                {/* Dynamic config builder based on counter_type */}
                <ConfigBuilder counterType={type} />
                
                <TextField
                  label="Customer Headline Template"
                  name="headline_template"
                  autoComplete="off"
                  placeholder="Spend ${{spend}}, get ${{reward}} off your next ${{threshold}}+"
                  helpText="Use {{placeholders}} for dynamic values"
                />
                
                <TextField
                  label="Customer Description Template"
                  name="description_template"
                  multiline={4}
                  autoComplete="off"
                  placeholder="Complete this order for ${{spend}} or more..."
                />
                
                {/* Hidden field to store the config JSON */}
                <input 
                  type="hidden" 
                  name="counter_config" 
                  value={JSON.stringify(buildConfigFromForm(type))} 
                />
                
                <input 
                  type="hidden" 
                  name="target_portfolios" 
                  value={JSON.stringify([])} 
                />
                
                <Button submit variant="primary">Create Template</Button>
              </FormLayout>
            </Card>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function getCounterTypeOptions(category: CategoryKey) {
  const OPTIONS_BY_CATEGORY: Record<CategoryKey, Array<{ label: string; value: string }>> = {
    bounceback: [
      { label: "Future Order Reward", value: "bounceback_future" },
      { label: "Current Order Reward", value: "bounceback_current" },
    ],
    threshold: [
      { label: "Multi-Tier Thresholds", value: "threshold_two" },
      { label: "Single Threshold", value: "threshold_one" },
    ],
    multi_unit: [
      { label: "Per Unit Discount", value: "price_markdown_per_unit" },
      { label: "Bundle Discount", value: "price_markdown_bundle" },
    ],
    gwp: [
      { label: "Gift with Purchase", value: "gift_with_purchase" },
    ],
    percent_off: [
      { label: "Percent Off Order", value: "percent_off_order" },
      { label: "Percent Off Items", value: "percent_off_item" },
    ],
    shipping: [
      { label: "Free Shipping", value: "free_shipping" },
      { label: "Flat Rate Shipping", value: "flat_shipping" },
    ],
  };
  
  return OPTIONS_BY_CATEGORY[category] || [];
}

// Build config object based on type (placeholder values)
function buildConfigFromForm(counterType: string): any {
  switch (counterType) {
    case 'bounceback_future':
      return {
        type: 'bounceback_future',
        spend_threshold_cents: null,
        reward_cents: null,
        next_order_threshold_cents: null,
        validity_days: 60,
        from_date: 'order_date'
      };
    
    case 'threshold_two':
      return {
        type: 'threshold_two',
        thresholds: [
          { min_spend_cents: null, discount_percent: null },
          { min_spend_cents: null, discount_percent: null },
          { min_spend_cents: null, discount_percent: null }
        ]
      };
    
    case 'price_markdown_per_unit':
      return {
        type: 'price_markdown_per_unit',
        quantity_tiers: [
          { min_quantity: 1, discount_percent: null },
          { min_quantity: null, discount_percent: null }
        ]
      };
    
    case 'gift_with_purchase':
      return {
        type: 'gift_with_purchase',
        min_spend_cents: null,
        gift_product_id: null,
        gift_value_cents: null
      };
    
    case 'percent_off_order':
      return {
        type: 'percent_off_order',
        percent: null
      };
    
    case 'free_shipping':
      return {
        type: 'free_shipping'
      };
    
    default:
      return { type: counterType };
  }
}

// Dynamic config builder component
function ConfigBuilder({ counterType }: { counterType: string }) {
  switch (counterType) {
    case 'bounceback_future':
      return (
        <Card>
          <Text as="h4" variant="headingSm">Bounceback Configuration</Text>
          <div style={{ marginTop: "1rem" }}>
            <FormLayout>
              <TextField
                label="Spend Threshold (placeholder)"
                name="config_spend_threshold"
                type="number"
                suffix="cents"
                helpText="Leave blank for user to fill"
                autoComplete="off"
              />
              <TextField
                label="Reward Amount (placeholder)"
                name="config_reward"
                type="number"
                suffix="cents"
                autoComplete="off"
              />
              <TextField
                label="Next Order Threshold (placeholder)"
                name="config_next_threshold"
                type="number"
                suffix="cents"
                autoComplete="off"
              />
              <TextField
                label="Validity Days"
                name="config_validity_days"
                type="number"
                value="60"
                autoComplete="off"
              />
            </FormLayout>
          </div>
        </Card>
      );
    
    case 'threshold_two':
      return (
        <Card>
          <Text as="h4" variant="headingSm">Threshold Configuration</Text>
          <div style={{ marginTop: "1rem" }}>
            <FormLayout>
              <Text as="p" variant="bodySm">Configure up to 3 spending tiers</Text>
              <TextField 
                label="Tier 1 Min Spend" 
                name="tier1_spend" 
                type="number" 
                suffix="cents"  
                autoComplete="off"
              />
              <TextField 
                label="Tier 1 Discount %" 
                name="tier1_percent" 
                type="number" 
                suffix="%"  
                autoComplete="off"
              />
              
              <TextField 
                label="Tier 2 Min Spend" 
                name="tier2_spend" 
                type="number" 
                suffix="cents" 
                autoComplete="off"
              />
              <TextField 
                label="Tier 2 Discount %" 
                name="tier2_percent" 
                type="number" 
                suffix="%"  
                autoComplete="off"
              />
              
              <TextField 
                label="Tier 3 Min Spend (optional)" 
                name="tier3_spend" 
                type="number" 
                suffix="cents"  
                autoComplete="off"
              />
              <TextField 
                label="Tier 3 Discount % (optional)" 
                name="tier3_percent" 
                type="number" 
                suffix="%"  
                autoComplete="off"
              />
            </FormLayout>
          </div>
        </Card>
      );
    
    // Add more cases for other counter types
    default:
      return null;
  }
}
/*
// app/routes/app.templates.counter.new.tsx
import { useState } from "react";
import { Form, useActionData } from "@remix-run/react";
import { Page, Layout, Card, FormLayout, TextField, Select, Button, Banner, Text} from "@shopify/polaris";
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { seedCounterTemplates } from "../lib/queries/supabase/seedCounterTemplates";
import { getAuthContext } from "../lib/auth/getAuthContext.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId, session} = await getAuthContext(request);
  const formData = await request.formData();
  const shopDomain = session.shop;
  
  const template = {
    shops: shopsID,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    type: formData.get("type") as string,
    config: JSON.parse(formData.get("config") as string),
    headline: formData.get("headline") as string,
    message: formData.get("message") as string,
    target: JSON.parse(formData.get("target") as string || "[]"),
  };
  
  try {
    await seedCounterTemplates(template);
    return redirect("/app/templates");
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}

export default function NewCounterTemplate() {
  const actionData = useActionData<typeof action>();
  const [category, setCategory] = useState("bounceback");
  const [counterType, setCounterType] = useState("bounceback_future");
  
  return (
    <Page title="Create Counter Offer Template" backAction={{ url: "/app/templates" }}>
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner tone="critical" title="Error creating template">
              <p>{actionData.error}</p>
            </Banner>
          )}
          
          <Form method="post">
            <input type="hidden" name="shopsID" value={sessionStorage.shopsID} />
            
            <Card>
              <FormLayout>
                <TextField
                  label="Template Name"
                  name="name"
                  autoComplete="off"
                  placeholder="Bounceback: Buy $100, Get $50 Next Order"
                  helpText="Internal name to identify this template"
                />
                
                <TextField
                  label="Description"
                  name="description"
                  multiline={3}
                  autoComplete="off"
                  placeholder="Encourages repeat purchases by offering future discount"
                  helpText="What is this template for?"
                />
                
                <Select
                  label="Category"
                  name="category"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { label: "Bounceback", value: "bounceback" },
                    { label: "Threshold Discount", value: "threshold" },
                    { label: "Quantity Discount", value: "multi_unit" },
                    { label: "Gift with Purchase", value: "gwp" },
                    { label: "Percent Off", value: "percent_off" },
                    { label: "Free Shipping", value: "shipping" },
                  ]}
                />
                
                <Select
                  label="Counter Type"
                  name="type"
                  value={type}
                  onChange={setType}
                  options={getCounterTypeOptions(category)}
                  helpText="Technical implementation type"
                />
               
               
                <ConfigBuilder counterType={counterType} />
                
                <TextField
                  label="Customer Headline Template"
                  name="headline"
                  autoComplete="off"
                  placeholder="Spend ${{spend}}, get ${{reward}} off your next ${{threshold}}+"
                  helpText="Use {{placeholders}} for dynamic values"
                />
                
                <TextField
                  label="Customer Description Template"
                  name="message"
                  multiline={4}
                  autoComplete="off"
                  placeholder="Complete this order for ${{spend}} or more..."
                />
                
                <Button submit primary>Create Template</Button>
              </FormLayout>
            </Card>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function getCounterTypeOptions(category: string) {
  const OPTIONS_BY_CATEGORY = {
    bounceback: [
      { label: "Future Order Reward", value: "bounceback_future" },
      { label: "Current Order Reward", value: "bounceback_current" },
    ],
    threshold: [
      { label: "Multi-Tier Thresholds", value: "threshold_two" },
      { label: "Single Threshold", value: "threshold_one" },
    ],
    multi_unit: [
      { label: "Per Unit Discount", value: "price_markdown_per_unit" },
      { label: "Bundle Discount", value: "price_markdown_bundle" },
    ],
    gwp: [
      { label: "Gift with Purchase", value: "gift_with_purchase" },
    ],
    percent_off: [
      { label: "Percent Off Order", value: "percent_off_order" },
      { label: "Percent Off Items", value: "percent_off_item" },
    ],
    shipping: [
      { label: "Free Shipping", value: "free_shipping" },
      { label: "Flat Rate Shipping", value: "flat_shipping" },
    ],
  };
  
  return OPTIONS_BY_CATEGORY[category] || [];
}

// Dynamic config builder component
function ConfigBuilder({ counterType }: { counterType: string }) {
  switch (counterType) {
    case 'bounceback_future':
      return (
        <Card >
          <Text as="h4">Bounceback Configuration</Text>
          <FormLayout>
            <TextField
              label="Spend Threshold (placeholder)"
              name="config_spend_threshold"
              type="number"
              suffix="cents"
              helpText="Leave blank for user to fill"
              autoComplete="false"
            />
            <TextField
              label="Reward Amount (placeholder)"
              name="config_reward"
              type="number"
              suffix="cents"
               autoComplete="false"
            />
            <TextField
              label="Next Order Threshold (placeholder)"
              name="config_next_threshold"
              type="number"
              suffix="cents"
               autoComplete="false"
            />
            <TextField
              label="Validity Days"
              name="config_validity_days"
              type="number"
              value="60"
               autoComplete="false"
            />
          </FormLayout>
        </Card>
      );
    
    case 'threshold_two':
      return (
        <Card >
          <Text as="h4">Threshold Configuration</Text>"
          <FormLayout>
            <p>Configure up to 3 spending tiers</p>
            <TextField 
              label="Tier 1 Min Spend" 
              name="tier1_spend" 
              type="number" 
              suffix="cents"  
              autoComplete="false"/>
            <TextField 
              label="Tier 1 Discount %" 
              name="tier1_percent" 
              type="number" 
              suffix="%"  
              autoComplete="false"/>
            
            <TextField 
              label="Tier 2 Min Spend" 
              name="tier2_spend" 
              type="number" 
              suffix="cents" 
              autoComplete="false"/>
            <TextField 
              label="Tier 2 Discount %" 
              name="tier2_percent" 
              type="number" 
              suffix="%"  
              autoComplete="false"/>          
            <TextField 
              label="Tier 3 Min Spend (optional)" 
              name="tier3_spend" 
              type="number" 
              suffix="cents"  
              autoComplete="false"/>
            <TextField 
              label="Tier 3 Discount % (optional)" 
              name="tier3_percent" 
              type="number" 
              suffix="%"  
              autoComplete="false"/>
          </FormLayout>
        </Card>
      );
    
    // Add more cases for other counter types
    default:
      return null;
  }
}
  */