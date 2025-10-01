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
    
  const template = {
    shopsID: shopsID,
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
            <input type="hidden" name="shopsID" value={shopsID} />
            
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
                
                {/* Dynamic config builder based on counter_type */}
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