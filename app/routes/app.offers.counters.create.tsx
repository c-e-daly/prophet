// app/routes/app.offers.counter.create.tsx
import { useState } from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { Page, Layout, Card, Autocomplete, Select, TextField, Button, Text } from "@shopify/polaris";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getShopOffersByStatus } from "../lib/queries/supabase/getShopOffers";
import { createCounterOffer } from "../lib/queries/supabase/createCounterOffer";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopsID } = await getAuthContext(request);
  
  // Get pending/declined offers
  const offers = await getShopOffersByStatus(shopsID)
  
  return json({ offers });
}

export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId } = await getAuthContext(request);
  const formData = await request.formData();
  
  const counterOffer = {
    shopsID,
    offersID: Number(formData.get("offerId")),
    counterType: formData.get("counterType") as string,
    counterConfig: JSON.parse(formData.get("counterConfig") as string),
    counterOfferPrice: Number(formData.get("counterOfferPrice")),
    totalDiscountCents: Number(formData.get("totalDiscountCents")),
    headline: formData.get("headline") as string,
    description: formData.get("description") as string,
    internalNotes: formData.get("internalNotes") as string,
    createdByUserID: currentUserId,
  };
  
  const created = await createCounterOffer(counterOffer);
  
  return redirect(`/app/offers/counter/${created.id}`);
}

export default function CreateCounterOffer() {
  const { offers } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const preselectedOfferId = searchParams.get("offerId");
  
  const [selectedOfferId, setSelectedOfferId] = useState(preselectedOfferId || "");
  const [inputValue, setInputValue] = useState("");
  
  const options = offers
    .filter(o => o.consumerEmail?.toLowerCase().includes(inputValue.toLowerCase()))
    .map(o => ({
      value: o.id.toString(),
      label: `#${o.id} - ${o.consumerEmail} - ${o.offerStatus}`,
    }));
  
  return (
    <Page title="Create Counter Offer" backAction={{ url: "/app/offers/counter" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              <div style={{ marginBottom: '1rem' }}>
                <Autocomplete
                  options={options}
                  selected={selectedOfferId ? [selectedOfferId] : []}
                  onSelect={(selected) => setSelectedOfferId(selected[0])}
                  textField={
                    <Autocomplete.TextField
                      label="Search Offers"
                      value={inputValue}
                      onChange={setInputValue}
                      placeholder="Search by email or offer #"
                      autoComplete="off"
                    />
                  }
                />
                <input type="hidden" name="offerId" value={selectedOfferId} />
              </div>
              
              {selectedOfferId && (
                <>
                  {/* Rest of counter offer form */}
                  <Text variant="headingMd" as="h3">Counter Offer Details</Text>
                  {/* Add your counter offer builder fields here */}
                  
                  <div style={{ marginTop: '1rem' }}>
                    <Button submit variant="primary">Create Counter Offer</Button>
                  </div>
                </>
              )}
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}