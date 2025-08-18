import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";
import { DecisionEngineClient } from "../lib/decisonEngineClient";

// Helper function to safely round decimal values to 2 decimal places
const roundToTwoDecimals = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return null;
  }
  return parseFloat(num.toFixed(2));
};

export const run = async ({ params, logger, api }) => {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const BATCH_SIZE = 10;
  const ERROR_THRESHOLD = 0.5;

  try {
    const shopDomain = params.shopDomain || 'oldetownehardware.myshopify.com';

    const currentShop = await api.shopifyShop.maybeFindFirst({
      filter: { myshopifyDomain: { equals: shopDomain } },
      select: { id: true, myshopifyDomain: true, domain: true }
    });

    if (!currentShop) {
      const availableShops = await api.shopifyShop.findMany({
        select: { myshopifyDomain: true, domain: true }
      });
      const availableDomains = availableShops.map(shop => shop.myshopifyDomain || shop.domain).filter(Boolean);
      logger.error(`Shop not found for domain: ${shopDomain}`);
      logger.info(`Available shop domains: ${availableDomains.join(', ')}`);
      throw new Error(`Shop not found for domain: ${shopDomain}. Available domains: ${availableDomains.join(', ')}`);
    }

    const currentShopId = currentShop.id;
    logger.info(`Syncing carts for shop: ${currentShop.myshopifyDomain} (${currentShopId})`);

    const client = new DecisionEngineClient();
    const carts = await client.getByStoreUrl('/carts', shopDomain);
    logger.info(`Retrieved ${carts.length} carts filtered by storeUrl '${shopDomain}'`);

    if (carts.length === 0) {
      return {
        success: true,
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      };
    }

    logger.info(`Pre-fetching customers for shop ${currentShopId}...`);
    const customers = await api.shopifyCustomer.findMany({
      filter: { shopId: { equals: currentShopId } },
      select: { id: true, email: true },
      first: 250
    });

    const customerLookup = new Map();
    customers.forEach(customer => {
      if (customer.email) {
        customerLookup.set(customer.email, customer.id);
      }
    });

    logger.info(`Pre-fetched ${customers.length} customers for lookup`);

    logger.info(`Pre-fetching existing carts for shop ${currentShopId}...`);
    let allExistingCarts = [];
    let hasMore = true;
    let cursor;

    while (hasMore) {
      const existingCartsPage = await api.cart.findMany({
        filter: { shopId: { equals: currentShopId } },
        select: { id: true, externalId: true },
        first: 250,
        ...(cursor ? { after: cursor } : {})
      });

      allExistingCarts = allExistingCarts.concat(existingCartsPage);
      hasMore = existingCartsPage.hasNextPage;
      if (hasMore) {
        cursor = existingCartsPage.endCursor;
      }
    }

    const existingCartLookup = new Map();
    allExistingCarts.forEach(cart => {
      if (cart.externalId) {
        existingCartLookup.set(cart.externalId, cart.id);
      }
    });

    logger.info(`Pre-fetched ${allExistingCarts.length} existing carts for lookup`);

    const batches = [];
    for (let i = 0; i < carts.length; i += BATCH_SIZE) {
      batches.push(carts.slice(i, i + BATCH_SIZE));
    }

    logger.info(`Processing ${carts.length} carts in ${batches.length} batches of ${BATCH_SIZE}`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (const cartData of batch) {
        try {
          const totalProcessed = successCount + errorCount;
          if (totalProcessed > 0 && errorCount / totalProcessed > ERROR_THRESHOLD) {
            logger.warn(`Error rate too high (${Math.round(errorCount / totalProcessed * 100)}%). Exiting early.`);
            throw new Error(`Sync stopped early due to high error rate: ${errorCount} errors out of ${totalProcessed} processed`);
          }

          const mappedData = {
            externalId: cartData._id,
            cartStatus: cartData.cartStatus,
            cartCreateDate: cartData.cartCreateDate,
            cartCurrency: cartData.cartCurrency,
            cartUrl: cartData.cartUrl,
            cartToken: cartData.cartToken,
            cartTotalPrice: roundToTwoDecimals(cartData.cartTotalPrice),
            cartItemsSubtotal: roundToTwoDecimals(cartData.cartItemsSubtotal),
            cartItemCount: cartData.cartItemCount,
            cartUnitCount: cartData.cartUnitCount,
            storeUrl: cartData.storeUrl,
            consumer: cartData.consumer,
            merchant: cartData.Merchant || cartData.merchant,
            createdBy: cartData['Created By'],
            modifiedDate: cartData['Modified Date'],
            cartProductsList: cartData.cartProductsList,
            externalData: cartData,
            shop: { _link: currentShopId }
          };

          if (cartData.consumer && customerLookup.has(cartData.consumer)) {
            mappedData.customer = { _link: customerLookup.get(cartData.consumer) };
          }

          const existingCartId = existingCartLookup.get(cartData._id);

          if (existingCartId) {
            await api.cart.update(existingCartId, mappedData);
          } else {
            await api.cart.create(mappedData);
          }

          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `Error processing cart ${cartData._id}: ${error.message}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      const totalProcessed = successCount + errorCount;
      const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
      logger.info(`Batch ${batchIndex + 1}/${batches.length} completed (${progress}%). Total: ${totalProcessed}, Success: ${successCount}, Errors: ${errorCount}`);
    }

    const result = {
      success: true,
      totalProcessed: carts.length,
      successCount,
      errorCount,
      errors
    };

    logger.info(`Cart sync completed: ${successCount} successful, ${errorCount} errors out of ${carts.length} total`);
    return result;

  } catch (error) {
    logger.error(`Failed to sync carts from Decision Engine: ${error.message}`);
    throw error;
  }
};

export const params = {
  shopDomain: { type: "string" }
};

export const options = {
  returnType: true,
  timeoutMS: 300000 // 5 minutes
};
