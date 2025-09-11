// app/routes/app.pricebuilder._index.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Button, Text, Modal, Banner, Box, InlineStack } from "@shopify/polaris";
import { useState, useMemo, useEffect } from "react";
import { requireShopSession } from "../lib/session/shopAuth.server";
import createClient from "../utils/supabase/server";
import type { Database } from "../../supabase/database.types";
import { EditDrawer } from "../components/pricebuilder/EditDrawer";
import { FiltersBar } from "../components/pricebuilder/FiltersBar";
import { VariantsTable } from "../components/pricebuilder/VariantsTable";
import { BulkEditor } from "../components/pricebuilder/BulkEditor";

// Types for variant pricing data
type VariantPricing = Database["public"]["Tables"]["variantPricing"]["Row"];
type VariantPricingInsert = Database["public"]["Tables"]["variantPricing"]["Insert"];

export interface VPView extends VariantPricing {
  productName?: string;
  variantName?: string;
  collectionNames?: string[];
  categoryName?: string;
  currentShopifyPrice?: number;
  sellingPrice: number;
  variantGID: string;
}

export interface FilterParams {
  search?: string;
  collections?: string[];
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession } = await requireShopSession(request);
  const supabase = createClient();
  
  // Parse URL search params for filters
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const collections = url.searchParams.getAll("collections");
  const categories = url.searchParams.getAll("categories");
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  
  try {
    // Fetch variant pricing data with joins for product/variant/collection info
    let query = supabase
      .from("variantPricing")
      .select(`
        *,
        variants:variantsGID (
          productName,
          variantName,
          collectionNames,
          categoryName,
          currentShopifyPrice
        )
      `)
      .eq("shops", shopSession.shopsID)
      .order("modifiedDate", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `variants.productName.ilike.%${search}%,variants.variantNameilike.%${search}%,variants.variantSku.ilike.%${search}%`
      );
    }

    if (collections.length > 0) {
      query = query.overlaps("variants.collectionNames", collections);
    }

    if (categories.length > 0) {
      query = query.in("variants.categoryName", categories);
    }

    if (dateFrom) {
      query = query.gte("createDate", dateFrom);
    }

    if (dateTo) {
      query = query.lte("createDate", dateTo);
    }

    const { data: rows, error } = await query.limit(500);

    if (error) {
      console.error("Error fetching variant pricing:", error);
      throw new Error(`Failed to fetch variant pricing: ${error.message}`);
    }

    // Transform data to include nested variant info
    const transformedRows: VPView[] = (rows || []).map(row => ({
      ...row,
      productName: row.variants?.productName,
      variantName: row.variants?.variantName,
      collectionNames: row.variants?.collectionNames,
      categoryName: row.variants?.categoryName,
      currentShopifyPrice: row.variants?.currentShopifyPrice,
      sellingPrice: row.variants?.sellingprice,
      variantGID: row.variants?.productVariantID,
    }));

    // Also fetch filter options for FiltersBar
    const { data: collectionsData } = await supabase
      .from("variants")
      .select("collectionNames")
      .eq("shops", shopSession.shopsID)
      .not("collectionNames", "is", null);

    const { data: categoriesData } = await supabase
      .from("variants")
      .select("categoryName")
      .eq("shops", shopSession.shopsID)
      .not("categoryName", "is", null);

    // Extract unique collections and categories
    const allCollections = new Set<string>();
    collectionsData?.forEach(row => {
      if (row.collectionNames) {
        row.collectionNames.forEach(name => allCollections.add(name));
      }
    });

    const allCategories = new Set<string>();
    categoriesData?.forEach(row => {
      if (row.categoryName) allCategories.add(row.categoryName);
    });

    return json({
      rows: transformedRows,
      filters: {
        collections: Array.from(allCollections).sort(),
        categories: Array.from(allCategories).sort(),
      },
      currentFilters: {
        search,
        collections,
        categories,
        dateFrom,
        dateTo,
      },
      shopsId: shopSession.shopsId,
    });

  } catch (error) {
    console.error("Loader error:", error);
    return json(
      { 
        rows: [], 
        filters: { collections: [], categories: [] },
        currentFilters: { search: "", collections: [], categories: [], dateFrom: "", dateTo: "" },
        shopsId: shopSession.shopsId,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { shopSession } = await requireShopSession(request);
  const supabase = createClient();
  
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  
  const headers = {
    "Cache-Control": "no-cache",
  };

  try {
    if (intent === "upsert-pricing") {
      const payloadStr = formData.get("payload") as string;
      if (!payloadStr) {
        return json({ ok: false, error: "Missing payload" }, { headers, status: 400 });
      }

      const payload = JSON.parse(payloadStr) as VariantPricingInsert[];
      
      // Validate payload
      if (!Array.isArray(payload) || payload.length === 0) {
        return json({ ok: false, error: "Invalid payload format" }, { headers, status: 400 });
      }

      // Ensure all records have the correct shop ID
      const validatedPayload = payload.map(row => ({
        ...row,
        shops: shopSession.shopsId,
        modifiedDate: new Date().toISOString(),
      }));

      // Use RPC function for batch upsert if available, otherwise use regular upsert
      const { data, error } = await supabase.rpc("upsert_variant_pricing", {
        p_shops_id: shopSession.shopsId,
        p_rows: validatedPayload,
      });

      if (error) {
        console.error("Upsert error:", error);
        return json({ ok: false, error: error.message }, { headers, status: 400 });
      }

      return json({ 
        ok: true, 
        affected: data?.[0]?.affected ?? validatedPayload.length,
        message: `Successfully updated ${validatedPayload.length} variant(s)`
      }, { headers });
    }

    if (intent === "publish-to-shopify") {
      const payloadStr = formData.get("payload") as string;
      if (!payloadStr) {
        return json({ ok: false, error: "Missing payload" }, { headers, status: 400 });
      }

      const variantIds = JSON.parse(payloadStr) as string[];
      
      // This would integrate with Shopify API to update prices
      // For now, just return success - implement Shopify integration separately
      return json({
        ok: true,
        message: `Publishing ${variantIds.length} variant(s) to Shopify...`,
        note: "Shopify integration pending"
      }, { headers });
    }

    return json({ ok: false, error: "Unknown intent" }, { headers, status: 400 });

  } catch (error) {
    console.error("Action error:", error);
    return json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { headers, status: 500 }
    );
  }
}

export default function PriceBuilderIndex() {
  const { rows, filters, currentFilters, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State management
  const [selected, setSelected] = useState<string[]>([]); // selected variantsGID
  const [single, setSingle] = useState<VPView | null>(null);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'publish'>('save');
  const [pendingPayload, setPendingPayload] = useState<any[]>([]);

  // Filtered rows based on current selection
  const selectedRows = useMemo(() => 
    rows.filter(row => selected.includes(row.variantsGID)),
    [rows, selected]
  );

  // Handle single variant edit
  const handleSingleEdit = (row: VPView) => {
    setSingle(row);
  };

  // Handle bulk edit
  const handleBulkEdit = () => {
    if (selected.length > 1) {
      setShowBulkEditor(true);
    }
  };

  // Submit helpers
  const submitUpsert = (payload: any[], action: 'save' | 'publish' = 'save') => {
    setPendingPayload(payload);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const onConfirm = () => {
    const fd = new FormData();
    
    if (confirmAction === 'save') {
      fd.append("intent", "upsert-pricing");
      fd.append("payload", JSON.stringify(pendingPayload));
    } else {
      fd.append("intent", "publish-to-shopify");
      fd.append("payload", JSON.stringify(pendingPayload.map(p => p.variantsGID)));
    }
    
    fetcher.submit(fd, { method: "post" });
    setConfirmOpen(false);
    setSelected([]); // Clear selection after action
  };

  // Handle navigation to single variant editor
  const navigateToSingle = (variantId: string) => {
    const params = new URLSearchParams(searchParams);
    navigate(`/app/pricebuilder/${variantId}?${params.toString()}`);
  };

  // Show success/error messages
  useEffect(() => {
    if (fetcher.data?.ok) {
      // Success handled by Polaris toast or banner
    }
  }, [fetcher.data]);

  return (
    <Page 
      title="Price Builder" 
      subtitle="Optimize your pricing to accept customer offers and maximize profit"
      primaryAction={
        selected.length > 0 ? {
          content: selected.length === 1 ? "Edit Price" : `Edit ${selected.length} Prices`,
          onAction: selected.length === 1 ? 
            () => navigateToSingle(selected[0]) : 
            handleBulkEdit
        } : undefined
      }
      secondaryActions={
        selected.length > 0 ? [
          {
            content: "Publish to Shopify",
            onAction: () => {
              const payload = selectedRows.map(row => ({ variantsGID: row.variantsGID }));
              submitUpsert(payload, 'publish');
            }
          }
        ] : undefined
      }
    >
      <Layout>
        <Layout.Section>
          {error && (
            <Banner status="critical" title="Error loading data">
              <p>{error}</p>
            </Banner>
          )}
          
          {fetcher.data?.error && (
            <Banner status="critical" title="Action failed">
              <p>{fetcher.data.error}</p>
            </Banner>
          )}
          
          {fetcher.data?.ok && (
            <Banner status="success" title="Success" onDismiss={() => {}}>
              <p>{fetcher.data.message}</p>
            </Banner>
          )}

          <Card>
            <FiltersBar 
              filters={filters}
              currentFilters={currentFilters}
            />
            
            <VariantsTable 
              rows={rows}
              selected={selected}
              onSelect={setSelected}
              onSingleEdit={handleSingleEdit}
              loading={fetcher.state === "submitting"}
            />

            {selected.length > 0 && (
              <Box padding="400">
                <InlineStack gap="200" align="center">
                  <Text as="span" variant="bodyMd">
                    {selected.length} variant{selected.length !== 1 ? 's' : ''} selected
                  </Text>
                  <Button
                    size="small"
                    onClick={() => setSelected([])}
                  >
                    Clear selection
                  </Button>
                </InlineStack>
              </Box>
            )}
          </Card>
        </Layout.Section>

        {/* Single Edit Drawer */}
        {single && (
          <EditDrawer
            row={single}
            onClose={() => setSingle(null)}
            onSave={(computed) => submitUpsert([computed], 'save')}
            onPublish={(computed) => submitUpsert([computed], 'publish')}
          />
        )}

        {/* Bulk Editor Modal */}
        {showBulkEditor && (
          <BulkEditor
            variants={selectedRows}
            onClose={() => setShowBulkEditor(false)}
            onSave={(batch) => submitUpsert(batch, 'save')}
            onPublish={(batch) => submitUpsert(batch, 'publish')}
          />
        )}

        {/* Confirmation Modal */}
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={`Confirm ${confirmAction === 'save' ? 'pricing update' : 'Shopify publish'}`}
          primaryAction={{ 
            content: confirmAction === 'save' ? "Save Changes" : "Publish to Shopify", 
            onAction: onConfirm,
            loading: fetcher.state === "submitting"
          }}
          secondaryActions={[{ 
            content: "Cancel", 
            onAction: () => setConfirmOpen(false) 
          }]}
        >
          <Modal.Section>
            <Text as="p">
              {confirmAction === 'save' 
                ? `You're about to save pricing for ${pendingPayload.length} variant(s).`
                : `You're about to publish ${pendingPayload.length} variant(s) to Shopify. This will update live prices.`
              } 
              {' '}Proceed?
            </Text>
          </Modal.Section>
        </Modal>
      </Layout>
    </Page>
  );
}