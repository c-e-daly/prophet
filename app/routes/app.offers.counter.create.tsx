// app/routes/app.offers.counter.create.tsx
import { useState } from "react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { Page, Layout, Card, Autocomplete, Button, Text } from "@shopify/polaris";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getShopOffersByStatus } from "../lib/queries/supabase/getShopOffers";
import { createCounterOffer } from "../lib/queries/supabase/createCounterOffer";
import type { Tables } from "../lib/types/dbTables";
import type { CreateCounterOfferInput } from "../lib/types/counterOffers";

type OfferRow = Tables<"offers">;

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopsID } = await getAuthContext(request);
  const { offers } = await getShopOffersByStatus(shopsID); // returns { offers, count }
  return json({ offers });
}

export async function action({ request }: ActionFunctionArgs) {
  const { shopsID, currentUserId } = await getAuthContext(request);
  if (!currentUserId) throw new Response("Missing current user", { status: 401 });

  const formData = await request.formData();
  const offersID = Number(formData.get("offerId"));
  if (!offersID) throw new Response("Missing offerId", { status: 400 });

  const counterType = String(formData.get("counterType") ?? "FixedPrice");
  const counterConfig = JSON.parse(String(formData.get("counterConfig") ?? "{}"));
  const counterOfferPrice = Number(formData.get("counterOfferPrice") ?? 0); // dollars
  const totalDiscountCents = Number(formData.get("totalDiscountCents") ?? 0);
  const headline = String(formData.get("headline") ?? "");
  const description = String(formData.get("description") ?? "");
  const reason = formData.get("reason") ? String(formData.get("reason")) : undefined;
  const internalNotes = formData.get("internalNotes") ? String(formData.get("internalNotes")) : undefined;
  const strategyRationale = formData.get("strategyRationale")
    ? String(formData.get("strategyRationale"))
    : undefined;
  const requiresApproval = String(formData.get("requiresApproval") ?? "false") === "true";
  const expiresAt = formData.get("expiresAt") ? String(formData.get("expiresAt")) : undefined;

  // Seed mandatory computed fields (replace with real server-side calcs later)
  const payload: CreateCounterOfferInput = {
    shopsID,
    offersID,
    counterType,
    counterConfig,
    counterOfferPrice,                  // dollars — if your table expects cents, convert in the query helper
    totalDiscountCents,
    estimatedMarginPercent: 0,
    estimatedMarginCents: 0,
    originalMarginPercent: 0,
    originalMarginCents: 0,
    marginImpactCents: 0,
    predictedAcceptanceProbability: 0,
    confidenceScore: 0,
    predictionFactors: {},
    expectedRevenueCents: Math.max(0, Math.round(counterOfferPrice * 100)),
    expectedMarginCents: 0,
    expectedValueScore: 0,
    headline,
    description,
    reason,
    internalNotes,
    strategyRationale,
    requiresApproval,
    createdByUserID: currentUserId,
    expiresAt,
  };

  const created = await createCounterOffer(payload);

  // Your insert likely returns the row with FK `offers` (not `offersID`)
  const parentOfferId = (created as any).offers ?? offersID;
  return redirect(`/app/offers/counter/${parentOfferId}`);
}

export default function CreateCounterOffer() {
  const { offers } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const preselectedOfferId = searchParams.get("offerId");

  const [selectedOfferId, setSelectedOfferId] = useState(preselectedOfferId || "");
  const [inputValue, setInputValue] = useState("");

  const lower = inputValue.toLowerCase();
  const filtered: OfferRow[] = Array.isArray(offers)
    ? offers.filter((o) => {
        const email = (o.consumerEmail || "").toLowerCase();
        const idStr = String(o.id || "").toLowerCase();
        return email.includes(lower) || idStr.includes(lower);
      })
    : [];

  const options = filtered.map((o) => ({
    value: String(o.id),
    label: `#${o.id} • ${o.consumerEmail ?? "unknown"} • ${o.offerStatus ?? "—"}`,
  }));

  return (
    <Page title="Create Counter Offer" backAction={{ url: "/app/offers/counter" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              <div style={{ marginBottom: "1rem" }}>
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
                  <Text variant="headingMd" as="h3">Counter Offer Details</Text>

                  {/* Minimal hidden fields for now. Replace with your builder’s inputs. */}
                  <input type="hidden" name="counterType" value="FixedPrice" />
                  <input type="hidden" name="counterConfig" value='{"kind":"FixedPrice"}' />

                  {/* You’ll wire these from your UI */}
                  <input type="hidden" name="counterOfferPrice" value="0" />
                  <input type="hidden" name="totalDiscountCents" value="0" />
                  <input type="hidden" name="headline" value="" />
                  <input type="hidden" name="description" value="" />
                  <input type="hidden" name="reason" value="" />
                  <input type="hidden" name="internalNotes" value="" />
                  <input type="hidden" name="strategyRationale" value="" />
                  <input type="hidden" name="requiresApproval" value="false" />
                  {/* Optional ISO 8601, e.g. 2025-12-31T23:59:00Z */}
                  <input type="hidden" name="expiresAt" value="" />

                  <div style={{ marginTop: "1rem" }}>
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
