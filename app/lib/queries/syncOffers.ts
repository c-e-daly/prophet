import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";
import { DecisionEngineClient, getOffersForShop } from "../lib/decisionEngineClient";

// === Helper: Resolve shop and domain ===
const resolveShopAndDomain = async (params, api, connections, logger) => {
  if (!params) throw new Error("Params are required");
  if (!api) throw new Error("API context is not available");

  let shopDomain = params.shopDomain;
  let shop = null;

  if (!shopDomain && connections.shopify.currentShopId) {
    try {
      const currentShop = await api.shopifyShop.findOne(connections.shopify.currentShopId, {
        select: { id: true, domain: true, myshopifyDomain: true, name: true }
      });
      shopDomain = currentShop?.myshopifyDomain;
      shop = currentShop;
    } catch (error) {
      logger.warn(`Failed to get shop from currentShopId: ${error?.message || 'Unknown error'}`);
    }
  }

  if (!shopDomain) {
    throw new Error("shopDomain could not be resolved. Provide in params or ensure shop context.");
  }

  if (!shop) {
    shop = await api.shopifyShop.findFirst({
      filter: { myshopifyDomain: { equals: shopDomain } },
      select: { id: true, domain: true, myshopifyDomain: true, name: true }
    });

    if (!shop) throw new Error(`Shop not found for domain: ${shopDomain}`);
  }

  logger.info(`Found shop: ${shop.name} (${shop.myshopifyDomain})`);
  return { shop, shopDomain };
};

// === Helper: Find campaign by external ID ===
const findCampaignByExternalId = async (externalId, shopId, api, logger) => {
  try {
    logger.info(`Looking for campaign with iwtCampaignID: ${externalId}`);
    const campaign = await api.campaign.findFirst({
      filter: {
        AND: [
          { iwtCampaignID: { equals: externalId } },
          { shopId: { equals: shopId } }
        ]
      }
    });
    if (campaign) logger.info(`Found campaign: ${campaign.campaignName}`);
    return campaign;
  } catch (error) {
    logger.error(`Error finding campaign: ${error?.message || 'Unknown error'}`);
    return null;
  }
};

// === Helper: Find program by external ID ===
const findProgramByExternalId = async (externalId, shopId, api, logger) => {
  try {
    logger.info(`Looking for program with iwtProgramID: ${externalId}`);
    const program = await api.program.findFirst({
      filter: {
        AND: [
          { iwtProgramID: { equals: externalId } },
          { shopId: { equals: shopId } }
        ]
      }
    });
    if (program) logger.info(`Found program: ${program.programName}`);
    return program;
  } catch (error) {
    logger.error(`Error finding program: ${error?.message || 'Unknown error'}`);
    return null;
  }
};

// === Helper: Default campaign ===
const findOrCreateDefaultCampaign = async (shopId, api, logger) => {
  const externalId = `default-campaign-${shopId}`;
  const iwtId = `iwt-default-campaign-${shopId}`;
  try {
    let campaign = await api.campaign.findFirst({
      filter: {
        AND: [
          { externalId: { equals: externalId } },
          { shopId: { equals: shopId } }
        ]
      }
    });

    if (campaign) return campaign;

    const campaignData = {
      campaignName: "Default Campaign",
      externalId,
      iwtCampaignID: iwtId,
      active: true,
      shop: { _link: shopId }
    };

    campaign = await api.campaign.create(campaignData);
    if (!campaign?.id) throw new Error("Invalid campaign creation result");
    return campaign;

  } catch (error) {
    logger.error(`Failed to create default campaign: ${error?.message || 'Unknown error'}`);
    throw error;
  }
};

// === Helper: Default program ===
const findOrCreateDefaultProgram = async (shopId, campaignId, api, logger) => {
  const externalId = `default-program-${shopId}`;
  const iwtId = `iwt-default-program-${shopId}`;
  try {
    let program = await api.program.findFirst({
      filter: {
        AND: [
          { externalId: { equals: externalId } },
          { shopId: { equals: shopId } }
        ]
      }
    });

    if (program) return program;

    const programData = {
      programName: "Default Program",
      externalId,
      iwtProgramID: iwtId,
      isDefault: true,
      shop: { _link: shopId },
      campaign: { _link: campaignId },
      programId: 1
    };

    program = await api.program.create(programData);
    if (!program?.id) throw new Error("Invalid program creation result");
    return program;

  } catch (error) {
    logger.error(`Failed to create default program: ${error?.message || 'Unknown error'}`);
    throw error;
  }
};

// === Helper: Campaign + Program Resolver ===
const resolveCampaignAndProgram = async (externalOffer, shopId, defaultCampaign, defaultProgram, api, logger) => {
  let campaign = defaultCampaign;
  let program = defaultProgram;

  const externalCampaignId = externalOffer.campaignId || externalOffer.iwtCampaignID;
  if (externalCampaignId) {
    const found = await findCampaignByExternalId(externalCampaignId.toString(), shopId, api, logger);
    if (found) campaign = found;
    else logger.warn(`Fallback to default campaign`);
  }

  const externalProgramId = externalOffer.programId || externalOffer.iwtProgramID;
  if (externalProgramId) {
    const found = await findProgramByExternalId(externalProgramId.toString(), shopId, api, logger);
    if (found) program = found;
    else logger.warn(`Fallback to default program`);
  }

  return { campaign, program };
};

// === Helper: Offer Mapper ===
const mapExternalOfferToGadgetFields = (offer, shopId, campaignId, programId) => ({
  name: offer.name || offer.title || `Offer ${offer.id || "Unknown"}`,
  externalId: offer.id?.toString() || offer.externalId?.toString(),
  description: offer.description,
  discountType: offer.discountType || "percentage",
  discountValue: offer.discountValue || offer.discount || 0,
  minimumPurchase: offer.minimumPurchase || offer.minPurchase,
  maximumDiscount: offer.maximumDiscount || offer.maxDiscount,
  startDate: offer.startDate ? new Date(offer.startDate) : undefined,
  endDate: offer.endDate ? new Date(offer.endDate) : undefined,
  active: offer.active !== undefined ? offer.active : true,
  usageLimit: offer.usageLimit || offer.maxUsage,
  priority: offer.priority || 1,
  targetAudience: offer.targetAudience,
  conditions: offer.conditions,
  externalData: offer.externalData || offer,
  shop: { _link: shopId },
  campaign: { _link: campaignId },
  program: { _link: programId }
});

// === MAIN RUN ===
export const run = async ({ params, logger, api, connections }) => {
  logger.info("=== Starting Offer Sync Action ===");

  const stats = {
    totalReceived: 0,
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    fallbacksCreated: 0,
    errorDetails: []
  };

  try {
    const { shop, shopDomain } = await resolveShopAndDomain(params, api, connections, logger);
    const externalOffers = await getOffersForShop(shopDomain);

    if (!Array.isArray(externalOffers)) throw new Error("Invalid offer format");
    stats.totalReceived = externalOffers.length;

    if (externalOffers.length === 0) {
      return { success: true, message: "No offers to process", shopDomain, ...stats };
    }

    const defaultCampaign = await findOrCreateDefaultCampaign(shop.id, api, logger);
    const defaultProgram = await findOrCreateDefaultProgram(shop.id, defaultCampaign.id, api, logger);

    if (!defaultCampaign.id || !defaultProgram.id) {
      stats.fallbacksCreated += 2;
    }

    for (const offer of externalOffers) {
      try {
        stats.processed++;

        if (!offer.id && !offer.externalId) {
          logger.warn(`Skipping offer without ID`);
          stats.errors++;
          stats.errorDetails.push({ error: "Missing ID", offer });
          continue;
        }

        const externalId = offer.id?.toString() || offer.externalId?.toString();

        const existing = await api.offer.findFirst({
          filter: {
            AND: [
              { externalId: { equals: externalId } },
              { shopId: { equals: shop.id } }
            ]
          }
        });

        const { campaign, program } = await resolveCampaignAndProgram(offer, shop.id, defaultCampaign, defaultProgram, api, logger);
        const offerData = mapExternalOfferToGadgetFields(offer, shop.id, campaign.id, program.id);

        if (existing) {
          await api.offer.update(existing.id, offerData);
          stats.updated++;
        } else {
          await api.offer.create(offerData);
          stats.created++;
        }

      } catch (error) {
        stats.errors++;
        stats.errorDetails.push({ error: error.message, offer });
      }
    }

    return { success: true, message: `Offer sync completed for ${shopDomain}`, shopDomain, ...stats };

  } catch (error) {
    return {
      success: false,
      message: `Offer sync failed: ${error.message}`,
      shopDomain: params?.shopDomain || "unknown",
      ...stats,
      errors: stats.errors + 1,
      errorDetails: [...stats.errorDetails, { error: error.message }]
    };
  }
};

export const params = {
  shopDomain: { type: "string" }
};

export const options = {
  returnType: true
};
