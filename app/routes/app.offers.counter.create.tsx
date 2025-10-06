// app/routes/app.offers.counter.create.tsx
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form, useNavigation } from "@remix-run/react";
import { Page, Layout, Card, Select, TextField, Button, BlockStack, Text, Divider, InlineStack } from "@shopify/polaris";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import createClient from "../../supabase/server";
import { formatCurrencyUSD } from "../utils/format";


function buildCounterConfig(counterType: string, discountValue: number) {
  switch (counterType) {
    case "percent_off_order":
      return { type: "percent_off_order", percent: discountValue };
    case "price_markdown_order":
      return { type: "price_markdown_order", markdown_cents: discountValue * 100 };
    case "free_shipping":
      return { type: "free_shipping" };
    case "bounceback_current":
      return {
        type: "bounceback_current",
        spend_threshold_cents: 10000,
        reward_cents: discountValue * 100,
        validity_days: 30,
      };
    case "bounceback_future":
      return {
        type: "bounceback_future",
        next_order_threshold_cents: 10000,
        reward_cents: discountValue * 100,
        validity_days: 60,
        from_date: "order_date",
      };
    default:
      return { type: counterType, value: discountValue };
  }
}

// Loader - just get the offer details to show context
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shopsID } = await getAuthContext(request);
  const url = new URL(request.url);
  const offersID = url.searchParams.get("offersID");
  
  if (!offersID) {
    throw new Response("Offer ID required", { status: 400 });
  }
  
  const supabase = createClient();
  
  // Get offer details for context
  const { data: offer, error } = await supabase
    .from("offers")
    .select(`
      *,
      carts (*),
      consumers (*),
      campaigns (*),
      programs (*)
    `)
    .eq("id", Number(offersID))
    .eq("shops", shopsID)
    .single();
  
  if (error || !offer) {
    throw new Response("Offer not found", { status: 404 });
  }
  
  return json({ offer });
};

// Action - create the counter offer when form is submitted
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shopsID, currentUserId } = await getAuthContext(request);
  const formData = await request.formData();
  
  const offerId = Number(formData.get("offerId"));
  const counterType = formData.get("counterType") as string;
  const discountValue = Number(formData.get("discountValue"));
  const description = formData.get("description") as string;
  const internalNotes = formData.get("internalNotes") as string;
  
  // Build counter config based on type
  const counterConfig = buildCounterConfig(counterType, discountValue);
  
  // Get offer details to calculate counter price
  const supabase = createClient();
  const { data: offer } = await supabase
    .from("offers")
    .select("offerPrice, carts(cartTotalPrice)")
    .eq("id", offerId)
    .single();
  
  const cartPrice = offer?.carts?.cartTotalPrice || offer?.offerPrice || 0;
  
  // Calculate counter offer price based on discount
  let counterOfferPrice = cartPrice;
  if (counterType === "percent_off_order") {
    counterOfferPrice = Math.round(cartPrice * (1 - discountValue / 100));
  } else if (counterType === "price_markdown_order") {
    counterOfferPrice = cartPrice - (discountValue * 100);
  }
  
  const totalDiscountCents = cartPrice - counterOfferPrice;
  
  // Create the counter offer
  const { data: newCounter, error } = await supabase
    .from("counterOffers")
    .insert({
      shops: shopsID,
      offers: offerId,
      offerStatus: "Draft",
      counterType,
      counterConfig,
      counterOfferPrice,
      totalDiscountCents,
      description,
      internalNotes,
      createdByUser: currentUserId,
      createDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating counter offer:", error);
    throw new Response("Failed to create counter offer", { status: 500 });
  }
  
  // Redirect back to offer details
  return redirect(`/app/offers/${offerId}`);
};

export default function CreateCounterOffer() {
  const { offer } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const offerId = searchParams.get("offerId");
  const cartPrice = offer.carts?.cartTotalPrice || offer.offerPrice || 0;
  
  return (
    <Page
      title="Create Counter Offer"
      subtitle={`For Offer #${offer.id}`}
      backAction={{ content: "Back to Offer", url: `/app/offers/${offer.id}` }}
    >
      <Form method="post">
        <input type="hidden" name="offerId" value={offerId || ""} />
        
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Counter Offer Details</Text>
                
                <Select
                  label="Counter Strategy"
                  name="counterType"
                  options={[
                    { label: "Percent Off Order", value: "percent_off_order" },
                    { label: "Price Markdown", value: "price_markdown_order" },
                    { label: "Spend & Save Today", value: "bounceback_current" },
                    { label: "Save On Next Order", value: "bounceback_future" },
                    { label: "Free Shipping", value: "free_shipping" },
                  ]}
                  helpText="Choose how you want to structure this counter offer"
                />
                
                <TextField
                  label="Discount Value"
                  name="discountValue"
                  type="number"
                  autoComplete="off"
                  placeholder="15"
                  helpText="Enter percentage (e.g., 15 for 15%) or dollar amount"
                />
                
                <TextField
                  label="Message to Customer"
                  name="description"
                  multiline={4}
                  autoComplete="off"
                  placeholder="We'd love to make this work for you..."
                  helpText="This message will be shown to the customer"
                />
                
                <TextField
                  label="Internal Notes"
                  name="internalNotes"
                  multiline={2}
                  autoComplete="off"
                  placeholder="Why this strategy was chosen..."
                  helpText="Internal notes, not visible to customer"
                />
                
                <Button 
                  submit 
                  variant="primary"
                  loading={isSubmitting}
                >
                  Create Counter Offer
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Offer Context</Text>
                <Divider />
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Customer</Text>
                    <Text as="span">{offer.consumers?.displayName || offer.consumers?.email || "Unknown"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Offer Price</Text>
                    <Text as="span">{formatCurrencyUSD(offer.offerPrice || 0)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Cart Price</Text>
                    <Text as="span">{formatCurrencyUSD(cartPrice)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Campaign</Text>
                    <Text as="span">{offer.campaigns?.name || "—"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" tone="subdued">Program</Text>
                    <Text as="span">{offer.programs?.name || "—"}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
}












































































