// app/lib/queries/shopify/publishVariantPrice.ts
import { authenticate } from "../../../shopify.server";


type PublishPriceInput = {
  variantGID: string;
  price: number; // in dollars, e.g., 99.99
  compareAtPrice?: number | null;
};

type PublishPriceResult = {
  success: boolean;
  variantGID: string;
  price: number;
  error?: string;
};

/**
 * Publish a single variant price to Shopify via GraphQL
 */
export async function publishVariantPriceToShopify(
  request: Request,
  input: PublishPriceInput
): Promise<PublishPriceResult> {
  try {
    const { admin } = await authenticate.admin(request);

    const mutation = `
      mutation productVariantUpdate($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
            compareAtPrice
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        id: input.variantGID,
        price: input.price.toFixed(2),
        compareAtPrice: input.compareAtPrice ? input.compareAtPrice.toFixed(2) : null,
      },
    };

    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.productVariantUpdate?.userErrors?.length > 0) {
      const errors = result.data.productVariantUpdate.userErrors
        .map((e: any) => e.message)
        .join(", ");
      
      return {
        success: false,
        variantGID: input.variantGID,
        price: input.price,
        error: errors,
      };
    }

    return {
      success: true,
      variantGID: input.variantGID,
      price: input.price,
    };
  } catch (error: any) {
    return {
      success: false,
      variantGID: input.variantGID,
      price: input.price,
      error: error.message || "Unknown error publishing to Shopify",
    };
  }
}

/**
 * Bulk publish multiple variant prices using productVariantsBulkUpdate
 * More efficient for updating 10+ variants at once
 */
export async function bulkPublishVariantPrices(
  request: Request,
  inputs: PublishPriceInput[]
): Promise<{ 
  success: boolean; 
  results?: PublishPriceResult[]; 
  error?: string;
  jobId?: string;
}> {
  try {
    const { admin } = await authenticate.admin(request);

    // Map inputs to bulk update format
    const variants = inputs.map(input => ({
      id: input.variantGID,
      price: input.price.toFixed(2),
      compareAtPrice: input.compareAtPrice ? input.compareAtPrice.toFixed(2) : null,
    }));

    const mutation = `
      mutation productVariantsBulkUpdate($variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(variants: $variants) {
          productVariants {
            id
            price
            compareAtPrice
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = { variants };

    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.productVariantsBulkUpdate?.userErrors?.length > 0) {
      const errors = result.data.productVariantsBulkUpdate.userErrors
        .map((e: any) => `${e.field}: ${e.message}`)
        .join(", ");
      
      return {
        success: false,
        error: errors,
      };
    }

    // Map successful results
    const results: PublishPriceResult[] = inputs.map((input, idx) => {
      const updated = result.data?.productVariantsBulkUpdate?.productVariants?.[idx];
      return {
        success: !!updated,
        variantGID: input.variantGID,
        price: input.price,
      };
    });

    return {
      success: true,
      results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unknown error in bulk publish",
    };
  }
}

/**
 * Smart batch publish that automatically chooses between single and bulk updates
 * Uses bulk API for 10+ variants, individual updates for fewer
 */
export async function batchPublishVariantPrices(
  request: Request,
  inputs: PublishPriceInput[]
): Promise<PublishPriceResult[]> {
  // Use bulk API for 10+ variants
  if (inputs.length >= 10) {
    const bulkResult = await bulkPublishVariantPrices(request, inputs);
    if (bulkResult.success && bulkResult.results) {
      return bulkResult.results;
    }
    // If bulk fails, fall back to individual updates
    console.warn("Bulk update failed, falling back to individual updates:", bulkResult.error);
  }

  // Individual updates for < 10 variants or if bulk failed
  const results: PublishPriceResult[] = [];
  
  for (const input of inputs) {
    const result = await publishVariantPriceToShopify(request, input);
    results.push(result);
    
    // Add small delay to avoid rate limiting (only for individual updates)
    if (inputs.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  return results;
}

/**
 * Async bulk publish using bulkOperationRunMutation
 * Best for 100+ variants - runs asynchronously and polls for completion
 */
export async function asyncBulkPublishVariantPrices(
  request: Request,
  inputs: PublishPriceInput[]
): Promise<{
  success: boolean;
  bulkOperationId?: string;
  error?: string;
}> {
  try {
    const { admin } = await authenticate.admin(request);

    // Build the bulk operation mutation query
    const stagedUploadsCreate = `
      mutation {
        stagedUploadsCreate(input: {
          resource: BULK_MUTATION_VARIABLES,
          filename: "bulk-update-prices",
          mimeType: "text/jsonl",
          httpMethod: POST
        }) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Step 1: Create staged upload
    const uploadResponse = await admin.graphql(stagedUploadsCreate);
    const uploadResult = await uploadResponse.json();

    if (uploadResult.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      return {
        success: false,
        error: uploadResult.data.stagedUploadsCreate.userErrors
          .map((e: any) => e.message)
          .join(", "),
      };
    }

    const stagedTarget = uploadResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!stagedTarget) {
      return { success: false, error: "Failed to create staged upload" };
    }

    // Step 2: Upload JSONL data
    const jsonlData = inputs.map(input => JSON.stringify({
      input: {
        id: input.variantGID,
        price: input.price.toFixed(2),
        compareAtPrice: input.compareAtPrice ? input.compareAtPrice.toFixed(2) : null,
      }
    })).join("\n");

    const formData = new FormData();
    stagedTarget.parameters.forEach((param: any) => {
      formData.append(param.name, param.value);
    });
    formData.append("file", new Blob([jsonlData], { type: "text/jsonl" }));

    await fetch(stagedTarget.url, {
      method: "POST",
      body: formData,
    });

    // Step 3: Start bulk operation
    const bulkOperationMutation = `
      mutation {
        bulkOperationRunMutation(
          mutation: "mutation call($input: ProductVariantInput!) { productVariantUpdate(input: $input) { productVariant { id } userErrors { message field } } }",
          stagedUploadPath: "${stagedTarget.resourceUrl}"
        ) {
          bulkOperation {
            id
            status
            url
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const bulkResponse = await admin.graphql(bulkOperationMutation);
    const bulkResult = await bulkResponse.json();

    if (bulkResult.data?.bulkOperationRunMutation?.userErrors?.length > 0) {
      return {
        success: false,
        error: bulkResult.data.bulkOperationRunMutation.userErrors
          .map((e: any) => e.message)
          .join(", "),
      };
    }

    return {
      success: true,
      bulkOperationId: bulkResult.data?.bulkOperationRunMutation?.bulkOperation?.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unknown error in async bulk publish",
    };
  }
}

/**
 * Poll for bulk operation completion
 */
export async function pollBulkOperationStatus(
  request: Request,
  bulkOperationId: string
): Promise<{
  status: "CREATED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED";
  url?: string;
  errorCode?: string;
}> {
  const { admin } = await authenticate.admin(request);

  const query = `
    query {
      node(id: "${bulkOperationId}") {
        ... on BulkOperation {
          id
          status
          errorCode
          url
          objectCount
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const result = await response.json();

  return {
    status: result.data?.node?.status || "FAILED",
    url: result.data?.node?.url,
    errorCode: result.data?.node?.errorCode,
  };
}