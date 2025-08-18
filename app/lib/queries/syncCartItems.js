import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";
import { DecisionEngineClient } from "../lib/decisonEngineClient";

export const run = async ({ params, logger, api, connections }) => {
  logger.info("Starting cart items sync from Decision Engine");

  let successCount = 0;
  let errorCount = 0;
  let processedCount = 0;
  let skippedCount = 0;
  let linkedToCartCount = 0;
  let orphanedItemsCount = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let errorMessages = [];

  try {
    const shopDomain = params.shopDomain;
    logger.info({ shopDomain }, "Processing cart items for shop domain");

    const shop = await api.shopifyShop.findFirst({
      filter: { myshopifyDomain: { equals: shopDomain } },
      select: { id: true, myshopifyDomain: true, domain: true }
    });

    if (!shop) throw new Error(`Shop not found for domain: ${shopDomain}`);
    const shopId = shop.id;

    const client = new DecisionEngineClient();
    const cartItems = await client.getByStoreUrl("/cart_items", shopDomain);
    logger.info({ count: cartItems.length }, "Retrieved cart items from API");

    if (cartItems.length === 0) {
      return {
        success: true,
        processedCount: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        linkedToCartCount: 0,
        orphanedItemsCount: 0,
        createdCount: 0,
        updatedCount: 0,
        errorMessages: [],
        message: "No cart items found for this shop"
      };
    }

    // Load all carts
    const allCarts = [];
    let hasMoreCarts = true;
    let cartsAfter;

    while (hasMoreCarts) {
      const batch = await api.cart.findMany({
        filter: { shopId: { equals: shopId } },
        select: { id: true, externalId: true, cartToken: true },
        first: 250,
        after: cartsAfter
      });

      allCarts.push(...batch);
      hasMoreCarts = batch.length === 250;
      if (hasMoreCarts) cartsAfter = batch[batch.length - 1].id;
    }

    const cartsByExternalId = new Map();
    const cartsByToken = new Map();
    allCarts.forEach(cart => {
      if (cart.externalId) cartsByExternalId.set(cart.externalId, cart);
      if (cart.cartToken) cartsByToken.set(cart.cartToken, cart);
    });

    // Load all cart items
    const allCartItems = [];
    let hasMoreCartItems = true;
    let cartItemsAfter;

    while (hasMoreCartItems) {
      const batch = await api.cartItem.findMany({
        filter: { shopId: { equals: shopId } },
        select: { id: true, externalId: true },
        first: 250,
        after: cartItemsAfter
      });

      allCartItems.push(...batch);
      hasMoreCartItems = batch.length === 250;
      if (hasMoreCartItems) cartItemsAfter = batch[batch.length - 1].id;
    }

    const existingCartItemsMap = new Map();
    allCartItems.forEach(item => {
      if (item.externalId) existingCartItemsMap.set(item.externalId, item);
    });

    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < cartItems.length; i += BATCH_SIZE) {
      batches.push(cartItems.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const cartItemsToCreate = [];
      const cartItemsToUpdate = [];

      for (const cartItemData of batch) {
        processedCount++;

        try {
          if (!cartItemData._id) {
            skippedCount++;
            continue;
          }

          const roundDecimal = (value, decimals = 2) => {
            if (value == null || value === "") return null;
            const num = parseFloat(value);
            return isNaN(num) ? null : Math.round(num * 10 ** decimals) / 10 ** decimals;
          };

          let cartRecord = null;
          let linkMethod = null;

          if (cartItemData.cartToken) {
            cartRecord = cartsByToken.get(cartItemData.cartToken);
            if (cartRecord) linkMethod = "cartToken";
          }

          if (!cartRecord && cartItemData.cart) {
            cartRecord = cartsByExternalId.get(cartItemData.cart);
            if (cartRecord) linkMethod = "externalId";
          }

          if (cartRecord) linkedToCartCount++;
          else orphanedItemsCount++;

          let productRecord = null;
          if (cartItemData.productId || cartItemData.productGID) {
            const filter = {
              AND: [
                { shopId: { equals: shopId } },
                { OR: [] }
              ]
            };
            if (cartItemData.productId) {
              filter.AND[1].OR.push({ id: { equals: cartItemData.productId } });
            }
            if (cartItemData.productGID) {
              const parts = cartItemData.productGID.split("/");
              const id = parts[parts.length - 1];
              if (id && id !== cartItemData.productId) {
                filter.AND[1].OR.push({ id: { equals: id } });
              }
            }

            if (filter.AND[1].OR.length > 0) {
              const products = await api.shopifyProduct.findMany({ filter, first: 1 });
              productRecord = products?.[0] || null;
            }
          }

          let variantRecord = null;
          if (cartItemData.variantID || cartItemData.variantGID) {
            const filter = {
              AND: [
                { shopId: { equals: shopId } },
                { OR: [] }
              ]
            };
            if (cartItemData.variantID) {
              filter.AND[1].OR.push({ id: { equals: cartItemData.variantID } });
            }
            if (cartItemData.variantGID) {
              const parts = cartItemData.variantGID.split("/");
              const id = parts[parts.length - 1];
              if (id && id !== cartItemData.variantID) {
                filter.AND[1].OR.push({ id: { equals: id } });
              }
            }

            if (filter.AND[1].OR.length > 0) {
              const variants = await api.shopifyProductVariant.findMany({ filter, first: 1 });
              variantRecord = variants?.[0] || null;
            }
          }

          const cartItemInput = {
            externalId: cartItemData._id,
            productName: cartItemData.productName || null,
            externalProductId: cartItemData.productId || null,
            productGID: cartItemData.productGID || null,
            productCartKey: cartItemData.productCartKey || null,
            productHTML: cartItemData.productHTML || null,
            variantID: cartItemData.variantID || null,
            variantGID: cartItemData.variantGID || null,
            variantSKU: cartItemData.variantSKU || null,
            variantQuantity: cartItemData.variantQuantity || null,
            variantSellingPrice: roundDecimal(cartItemData.variantSellingPrice, 0),
            cartToken: cartItemData.cartToken || null,
            template: cartItemData.template || null,
            merchant: cartItemData.merchant || null,
            consumer: cartItemData.consumer || null,
            createdBy: cartItemData["Created By"] || null,
            modifiedDate: cartItemData["Modified Date"] ? new Date(cartItemData["Modified Date"]) : null,
            externalData: cartItemData,
            shop: { _link: shopId }
          };

          if (cartRecord) cartItemInput.cart = { _link: cartRecord.id };
          if (productRecord) cartItemInput.product = { _link: productRecord.id };
          if (variantRecord) cartItemInput.variant = { _link: variantRecord.id };

          const existingCartItem = existingCartItemsMap.get(cartItemData._id);
          if (existingCartItem) {
            cartItemsToUpdate.push({ id: existingCartItem.id, ...cartItemInput });
          } else {
            cartItemsToCreate.push(cartItemInput);
          }
        } catch (error) {
          errorCount++;
          if (errorMessages.length < 10) {
            errorMessages.push(`Cart item ${cartItemData._id}: ${error.message}`);
          }
        }
      }

      try {
        if (cartItemsToCreate.length > 0) {
          const results = await api.cartItem.bulkCreate(cartItemsToCreate);
          const successes = results.filter(r => r.success);
          createdCount += successes.length;
          successCount += successes.length;
          const failures = results.filter(r => !r.success);
          errorCount += failures.length;
        }

        if (cartItemsToUpdate.length > 0) {
          const results = await api.cartItem.bulkUpdate(cartItemsToUpdate);
          const successes = results.filter(r => r.success);
          updatedCount += successes.length;
          successCount += successes.length;
          const failures = results.filter(r => !r.success);
          errorCount += failures.length;
        }
      } catch (batchError) {
        errorCount += cartItemsToCreate.length + cartItemsToUpdate.length;
      }
    }

    return {
      success: true,
      processedCount,
      successCount,
      errorCount,
      skippedCount,
      linkedToCartCount,
      orphanedItemsCount,
      createdCount,
      updatedCount,
      errorMessages,
      message: `Processed ${processedCount} cart items`
    };
  } catch (error) {
    const mainErrorMsg = `Main sync error: ${error.message}`;
    if (errorMessages.length < 10) errorMessages.push(mainErrorMsg);
    return {
      success: false,
      processedCount,
      successCount,
      errorCount,
      skippedCount,
      linkedToCartCount,
      orphanedItemsCount,
      createdCount,
      updatedCount,
      errorMessages,
      error: error.message,
      message: "Cart items sync failed"
    };
  }
};

export const options = {
  timeoutMS: 600000
};

export const params = {
  shopDomain: {
    type: "string",
    default: "oldetownehardware.myshopify.com"
  }
};
