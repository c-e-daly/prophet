import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";
import { syncEntity } from "../lib/syncEntity";

const ENTITIES_TO_SYNC = [
  "campaigns",
  "programs",
  "offers",
  "carts",
  "cartItems",
  "users",
  "consumers"
];

export const run = async ({ params, logger, api }) => {
  const shopDomain = params.shopDomain;
  if (!shopDomain) throw new Error("Missing shopDomain");

  const results = {};

  for (const entityKey of ENTITIES_TO_SYNC) {
    logger.info(`🔄 Syncing entity: ${entityKey}`);
    try {
      results[entityKey] = await syncEntity(entityKey, shopDomain, api, logger);
    } catch (err) {
      logger.error(`❌ Failed to sync ${entityKey}`, { error: err.message });
      results[entityKey] = { error: err.message };
    }
  }

  logger.info("✅ Finished syncing all entities", { results });
  return results;
};
