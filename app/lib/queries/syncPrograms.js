import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { getSession } from "@shopify/shopify-api/express";
import { GraphQLClient, gql } from "graphql-request";
import { decisionEngineClient } from "../lib/decisonEngineClient";

export const run = async ({ params, logger, api, connections }) => {
  logger.info("Starting program sync from Decision Engine");

  try {
    const shopId = connections.shopify.currentShopId;
    let currentShop;

    if (shopId) {
      currentShop = await api.shopifyShop.findOne(shopId, {
        select: { id: true, myshopifyDomain: true }
      });
    } else {
      const shops = await api.shopifyShop.findMany({ 
        first: 1,
        select: { id: true, myshopifyDomain: true }
      });
      currentShop = shops[0];
      logger.warn("No current shop context, using fallback shop", { shopId: currentShop?.id });
    }

    if (!currentShop) throw new Error("No shop found for program sync");

    const programsResponse = await decisionEngineClient.get('/obj/programs');
    const programsData = programsResponse.data?.response?.results || [];

    logger.info(`Fetched ${programsData.length} programs from Decision Engine`);

    const relevantPrograms = programsData.filter((program) => {
      return program.storeUrl && program.storeUrl.includes(currentShop.myshopifyDomain);
    });

    logger.info(`Found ${relevantPrograms.length} programs matching shop domain ${currentShop.myshopifyDomain}`);

    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
      total: relevantPrograms.length
    };

    for (const programData of relevantPrograms) {
      try {
        let campaign = null;

        if (programData.campaign) {
          const campaigns = await api.campaign.findMany({
            filter: { 
              AND: [
                { externalId: { equals: programData.campaign } },
                { shopId: { equals: currentShop.id } }
              ]
            },
            first: 1
          });
          campaign = campaigns[0];
        }

        if (!campaign) {
          logger.warn(`Campaign not found for program ${programData._id}`, { 
            campaignExternalId: programData.campaign 
          });
          syncResults.errors++;
          continue;
        }

        const existingPrograms = await api.program.findMany({
          filter: {
            AND: [
              { externalId: { equals: programData._id } },
              { shopId: { equals: currentShop.id } }
            ]
          },
          first: 1
        });

        const programPayload = {
          externalId: programData._id,
          programName: programData.programName,
          programId: programData.programid,
          programFocus: programData.programFocus || null,
          isDefault: programData.isDefault || false,
          storeUrl: programData.storeUrl || null,
          codePrefix: programData.codePrefix || null,
          discountPrefix: programData.discountPrefix || null,
          programStartDate: programData.programStartDate ? new Date(programData.programStartDate) : null,
          programEndDate: programData.programEndDate ? new Date(programData.programEndDate) : null,
          expireTimeMinutes: programData.expireTimeMinutes || null,
          programAcceptRate: programData.programAcceptRate || null,
          programDeclineRate: programData.programDeclineRate || null,
          targetAOV: programData.targetAOV || null,
          targetMMU: programData.targetMMU || null,
          targetOrders: programData.targetOrders || null,
          combineShippingDiscounts: programData.combineShippingDiscounts || null,
          combineOrderDiscounts: programData.combineOrderDiscounts || null,
          combineProductDiscounts: programData.combineProductDiscounts || null,
          merchant: programData.merchant || null,
          createdBy: programData["Created By"] || null,
          modifiedDate: programData["Modified Date"] ? new Date(programData["Modified Date"]) : null,
          externalData: programData,
          campaign: { _link: campaign.id },
          shop: { _link: currentShop.id }
        };

        if (existingPrograms.length > 0) {
          await api.program.update(existingPrograms[0].id, programPayload);
          syncResults.updated++;
          logger.info(`Updated program: ${programData.programName}`, { externalId: programData._id });
        } else {
          await api.program.create(programPayload);
          syncResults.created++;
          logger.info(`Created program: ${programData.programName}`, { externalId: programData._id });
        }

      } catch (error) {
        logger.error(`Error processing program ${programData._id}: ${error.message}`);
        syncResults.errors++;
      }
    }

    const result = {
      success: true,
      message: `Program sync completed for shop ${currentShop.myshopifyDomain}`,
      summary: syncResults
    };

    logger.info("Program sync completed", result);
    return result;

  } catch (error) {
    logger.error("Program sync failed:", error.message);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
      summary: {
        created: 0,
        updated: 0,
        errors: 1,
        total: 0
      }
    };
  }
};
