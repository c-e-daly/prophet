// app/routes/app.pricebuilder._index.jsx
import { json, type LoaderFunctionArgs} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Button, Text, IndexTable, InlineStack } from "@shopify/polaris";
import { formatCurrencyUSD, formatDateTime} from "../utils/format";
import { getShopProductVariants, VariantRow } from "../lib/queries/supabase/getShopProductVariants";
import { ShopifyLink } from "../utils/ShopifyLink";
import { getShopsIDHelper } from "../../supabase/getShopsID.server";
import { authenticate } from "../shopify.server";

type LoaderData = {
  variants: VariantRow[];
  monthsback: number;
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
  shopSession: {
    shopDomain: string;
    shopsId: number;
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopsID = await getShopsIDHelper(session.shop); 

  const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  const sinceMonthsParam = url.searchParams.get("sinceMonths");
  const monthsBack = sinceMonthsParam === null ? 12 : Math.max(0, Number(sinceMonthsParam) || 0);
  const { variants, count } = await getShopProductVariants(shopsID, {limit, page});
  const total = count ?? 0;
  const hasMore = page * limit < total;

  return json({
    variants,
    count: total,
    hasMore,
    page,
    limit,
    shopSession: {
      shopDomain: session.shop,
      shopsID: shopsID,
    },
  });
};

export default function PriceBuilderIndex() {
  const { variants, count, hasMore, page, limit, shopSession } = useLoaderData<typeof loader>();

  const handleRowClick = (variant: VariantRow) => {

    console.log('Row clicked:', variant);
  };

  return (
    <Page
      title={`Price Builder `}
      subtitle="Manage pricing for your product variants"
      primaryAction={<Text as="span" variant="bodyMd">{count} total variants</Text>}
    >
      <Card>
        <IndexTable
          itemCount={variants.length}
          selectable={false}
          headings={[
            { title: "Variant" },
            { title: "SKU" },
            { title: "Inventory" },
            { title: "Shop Price" },
            { title: "Total Value" },
            { title: "Price Published" },
            { title: "Actions" },
          ]}
        >
          {variants.map((variant, index) => (
            <IndexTable.Row
              id={String(variant.id)}
              key={String(variant.id)}
              position={index}
              onClick={() => handleRowClick(variant)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {variant.variantName || "Default Title"}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {variant.variantSKU || "—"}
                </Text>
              </IndexTable.Cell>

               <IndexTable.Cell>
                 <Text variant="bodyMd" as="span">
                   {variant.inventoryQuantity ?? "—"}
                 </Text>
               </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatCurrencyUSD(variant.shopifyPrice ?? 0)}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {formatCurrencyUSD(variant.shopifyPrice ?? 0)}
                </Text>
              </IndexTable.Cell>
 
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {variant.pricePublishDate
                    ? formatDateTime(variant.pricePublishDate)
                    : "—"
                  }
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <div onClick={(e) => e.stopPropagation()}>
                  <ShopifyLink to={`/app/pricebuilder/${variant.id || variant.id}`}>
                    <Button>Edit Pricing</Button>
                  </ShopifyLink>
                </div>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <div style={{ marginTop: 12 }}>
        <InlineStack align="space-between" gap="400" blockAlign="center" wrap={false}>
          <ShopifyLink to={`/app/pricebuilder?page=${page - 1}&limit=${limit}`}>
            <Button disabled={page <= 1}>Previous</Button>
          </ShopifyLink>
          <Text as="span" variant="bodySm">
            Page {page} · Showing {variants.length} of {count}
          </Text>
          <ShopifyLink to={`/app/pricebuilder?page=${page + 1}&limit=${limit}`}>
            <Button disabled={!hasMore}>Next</Button>
          </ShopifyLink>
        </InlineStack>
      </div>
    </Page>
  );
}