// app/lib/queries/shopify/publishVariantPrice.ts
import { authenticate } from "../../../shopify.server";

type PublishPriceInput = {
  variantGID: string;
  price: number;            // e.g., 99.99
  compareAtPrice?: number | null;
};

type PublishPriceResult = {
  success: boolean;
  variantGID: string;
  price: number;
  error?: string;
};

// helper: lookup productId for a variant
async function getProductIdForVariant(admin: any, variantGID: string): Promise<string> {
  const q = `
    query ($id: ID!) {
      productVariant(id: $id) {
        id
        product { id }
      }
    }
  `;
  const resp = await admin.graphql(q, { variables: { id: variantGID } });
  const json = await resp.json();
  const productId = json?.data?.productVariant?.product?.id;
  if (!productId) throw new Error("Could not resolve productId for variant " + variantGID);
  return productId;
}

/**
 * Publish a single variant price using productVariantsBulkUpdate
 */
export async function publishVariantPriceToShopify(
  request: Request,
  input: PublishPriceInput
): Promise<PublishPriceResult> {
  try {
    const { admin } = await authenticate.admin(request);

    const productId = await getProductIdForVariant(admin, input.variantGID);

    const mutation = `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id price compareAtPrice }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      productId,
      variants: [
        {
          id: input.variantGID,
          price: input.price.toFixed(2),
          compareAtPrice: input.compareAtPrice != null ? input.compareAtPrice.toFixed(2) : null,
        },
      ],
    };

    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    const errs = result?.data?.productVariantsBulkUpdate?.userErrors ?? [];
    if (errs.length) {
      return {
        success: false,
        variantGID: input.variantGID,
        price: input.price,
        error: errs.map((e: any) => `${e.field?.join(".") ?? ""} ${e.message}`).join(", "),
      };
    }

    return { success: true, variantGID: input.variantGID, price: input.price };
  } catch (error: any) {
    return {
      success: false,
      variantGID: input.variantGID,
      price: input.price,
      error: error?.message || "Unknown error publishing to Shopify",
    };
  }
}


export async function bulkPublishVariantPrices(
  request: Request,
  inputs: PublishPriceInput[]
): Promise<{ success: boolean; results?: PublishPriceResult[]; error?: string }> {
  try {
    const { admin } = await authenticate.admin(request);

    // 1) resolve productId for each variant
    const productMap = new Map<string, PublishPriceInput[]>();
    for (const inp of inputs) {
      const productId = await getProductIdForVariant(admin, inp.variantGID);
      const arr = productMap.get(productId) ?? [];
      arr.push(inp);
      productMap.set(productId, arr);
    }

    // 2) call productVariantsBulkUpdate once per product
    const mutation = `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id price compareAtPrice }
          userErrors { field message }
        }
      }
    `;

    const results: PublishPriceResult[] = [];
    for (const [productId, group] of productMap.entries()) {
      const variables = {
        productId,
        variants: group.map(g => ({
          id: g.variantGID,
          price: g.price.toFixed(2),
          compareAtPrice: g.compareAtPrice != null ? g.compareAtPrice.toFixed(2) : null,
        })),
      };

      const resp = await admin.graphql(mutation, { variables });
      const json = await resp.json();

      const errs = json?.data?.productVariantsBulkUpdate?.userErrors ?? [];
      if (errs.length) {
        // record failures for this group
        for (const g of group) {
          results.push({
            success: false,
            variantGID: g.variantGID,
            price: g.price,
            error: errs.map((e: any) => `${e.field?.join(".") ?? ""} ${e.message}`).join(", "),
          });
        }
      } else {
        // success per variant
        for (const g of group) {
          results.push({ success: true, variantGID: g.variantGID, price: g.price });
        }
      }
    }

    return { success: results.every(r => r.success), results };
  } catch (e: any) {
    return { success: false, error: e?.message || "Unknown error in bulk publish" };
  }
}
