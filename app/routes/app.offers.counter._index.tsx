// app/routes/app.offers.counter._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Card, DataTable, Badge } from "@shopify/polaris";
import { getAuthContext } from "../lib/auth/getAuthContext.server";
import { getCounterOffers } from "../lib/queries/supabase/getShopCounterOffers";
import { formatCurrencyUSD, formatDateTime } from "../utils/format";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopsID } = await getAuthContext(request);
  
  const counterOffers = await getCounterOffers(shopsID);
  
  return json({ counterOffers });
}

export default function CounterOffersIndex() {
  const { counterOffers } = useLoaderData<typeof loader>();
  
  const rows = counterOffers.map(co => [
    <Link to={`/app/offers/${co.offers}`}>#{co.offers}</Link>,
    co.consumerEmail || "—",
    <Link to={`/app/offers/counter/${co.id}`}>
      <Badge tone={getStatusTone(co.offerStatus)}>{co.offerStatus}</Badge>
    </Link>,
    co.counterType,
    formatCurrencyUSD(co.counterOfferPrice),
    formatCurrencyUSD(co.totalDiscountCents),
    `${co.predictedAcceptanceProbability?.toFixed(0) || 0}%`,
    formatDateTime(co.createDate),
  ]);
  
  return (
    <Page 
      title="Counter Offers"
      primaryAction={{ content: "Create Counter Offer", url: "/app/offers/counter/create" }}
    >
      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'numeric', 'numeric', 'text']}
          headings={[
            'Offer #',
            'Customer',
            'Status',
            'Type',
            'Counter Price',
            'Discount',
            'Accept Prob',
            'Created',
          ]}
          rows={rows}
        />
      </Card>
    </Page>
  );
}

function getStatusTone(status: string) {
  if (status?.includes('Accepted')) return 'success';
  if (status?.includes('Declined') || status?.includes('Expired')) return 'critical';
  if (status?.includes('Sent') || status?.includes('Pending')) return 'attention';
  return undefined;
}